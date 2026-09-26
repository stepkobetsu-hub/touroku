// ===================================================
// 生徒・保護者登録フォーム - GAS APIバックエンド
// GitHub Pages版（CORS対応）
// ===================================================

function doGet(e) {
  if (e && e.parameter && e.parameter.code) return handleMoneyForwardOAuth_(e);
  if (e && e.parameter && e.parameter.page === 'roster') {
    return getRosterHtml_(false).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
  return getStudentRosterJson_();
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var result = registerStudent(data);
    return buildResponse(result);
  } catch (err) {
    return buildResponse({ success: false, message: 'リクエストエラー: ' + err.message });
  }
}

function buildResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// 以下は registration_backend.gs と同じ登録処理。デプロイ時は同ファイルの内容を連結する。
