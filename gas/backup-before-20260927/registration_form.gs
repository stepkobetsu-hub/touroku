// ===================================================
// 生徒・保護者登録フォーム - GAS APIバックエンド
// GitHub Pages版（CORS対応）
// ===================================================

// GETリクエスト：疎通確認用
function doGet(e) {
  if (e && e.parameter && e.parameter.code) return handleMoneyForwardOAuth_(e);
  if (e && e.parameter && e.parameter.page === 'roster') {
    return getRosterHtml_(false).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return getStudentRosterJson_();
}

// POSTリクエスト：フォームデータを受け取りシートに書き込む
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = registerStudent(data);
    return buildResponse(result);
  } catch (err) {
    return buildResponse({ success: false, message: 'リクエストエラー: ' + err.message });
  }
}

// CORSヘッダー付きレスポンスを返す
function buildResponse(obj) {
  var output = ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// シートへの書き込み
function registerStudent(data) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('☆マスタ');

    if (!sheet) {
      return { success: false, message: 'シート「☆マスタ」が見つかりません。' };
    }

    var now = new Date();
    var timestamp = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy/MM/dd HH:mm:ss');

    // D列の最終行を検出して次の行に書き込む
    var lastRow = sheet.getLastRow();
    var nextRow = lastRow + 1;

    if (lastRow >= 2) {
      var dCol = sheet.getRange(2, 4, lastRow - 1, 1).getValues();
      var lastUsed = 1;
      for (var i = dCol.length - 1; i >= 0; i--) {
        if (dCol[i][0] !== '') {
          lastUsed = i + 2;
          break;
        }
      }
      nextRow = lastUsed + 1;
    }

    // 列マッピング
    sheet.getRange(nextRow, 4).setValue(timestamp);           // D: タイムスタンプ
    sheet.getRange(nextRow, 5).setValue(data.studentName || '');  // E: 生徒氏名
    sheet.getRange(nextRow, 6).setValue(data.studentKana || '');  // F: フリガナ
    sheet.getRange(nextRow, 7).setValue(data.gender || '');       // G: 性別
    sheet.getRange(nextRow, 9).setValue(data.birthdate || '');    // I: 生年月日
    sheet.getRange(nextRow, 11).setValue(data.grade || '');       // K: 学年
    sheet.getRange(nextRow, 16).setValue(data.school || '');      // P: 在学学校
    sheet.getRange(nextRow, 17).setValue(data.parentName || '');  // Q: 保護者氏名
    sheet.getRange(nextRow, 18).setValue(data.parentKana || '');  // R: 保護者フリガナ
    sheet.getRange(nextRow, 19).setValue(data.relation || '');    // S: 続柄
    sheet.getRange(nextRow, 20).setValue(data.zip || '');         // T: 郵便番号
    sheet.getRange(nextRow, 21).setValue(data.addr1 || '');       // U: 住所1
    sheet.getRange(nextRow, 22).setValue(data.addr2 || '');       // V: 住所2
    sheet.getRange(nextRow, 23).setValue(data.addr3 || '');       // W: 住所3
    sheet.getRange(nextRow, 24).setValue(data.email || '');       // X: メール
    sheet.getRange(nextRow, 25).setValue(data.mobile || '');      // Y: 携帯
    sheet.getRange(nextRow, 26).setValue(data.homePhone || '');   // Z: 自宅電話

    return { success: true, message: '登録が完了しました。', row: nextRow };

  } catch (err) {
    return { success: false, message: 'エラーが発生しました: ' + err.message };
  }
}
