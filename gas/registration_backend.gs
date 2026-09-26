/**
 * 生徒・保護者登録フォーム用バックエンド。
 * 既存Webアプリの registerStudent(data) をこの実装で更新する。
 * スプレッドシートに紐づくApps Scriptを前提とする。
 */
const STUDENT_MASTER_SHEET_NAME = '☆マスタ';
const ALLOWED_CAMPUSES = ['神領', '大手', 'その他'];

function registerStudent(data) {
  validateStudentData_(data);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(STUDENT_MASTER_SHEET_NAME);
    if (!sheet) {
      throw new Error('保存先シート「' + STUDENT_MASTER_SHEET_NAME + '」が見つかりません。');
    }

    // D列を基準にすることで、他列に数式やメモがある場合も既存の登録位置を維持する。
    const nextRow = getNextRowByColumn_(sheet, 4);
    const studentId = getMaxNumericValue_(sheet, 1) + 1;
    const password = kanaToRomaji_(data.studentKana).slice(0, 4).toLowerCase();
    const qrData = 'STEP-' + studentId;
    const now = new Date();

    // 既存列を含め、値の書込みは新規行だけに限定する。
    const valuesByColumn = {
      1: studentId,
      2: 1,
      3: now,
      4: now,
      5: data.studentName,
      6: data.studentKana,
      7: data.gender,
      8: data.campus,
      9: parseLocalDate_(data.birthdate),
      11: data.grade,
      12: password,
      16: data.school,
      17: data.parentName,
      18: data.parentKana,
      19: data.relation,
      20: data.zip,
      21: data.addr1,
      22: data.addr2,
      23: data.addr3,
      24: data.email,
      25: data.mobile,
      26: data.homePhone || '',
      52: qrData
    };

    Object.keys(valuesByColumn).forEach(function(column) {
      sheet.getRange(nextRow, Number(column)).setValue(valuesByColumn[column]);
    });
    sheet.getRange(nextRow, 10).setFormula(buildGradeFormula_(nextRow));

    // 日付は値として保存し、表示だけ日本式に統一する。
    sheet.getRange(nextRow, 3).setNumberFormat('yyyy/m/d');
    sheet.getRange(nextRow, 9).setNumberFormat('yyyy/m/d');
    SpreadsheetApp.flush();

    return {
      success: true,
      studentId: studentId,
      password: password,
      qrData: qrData,
      row: nextRow
    };
  } finally {
    lock.releaseLock();
  }
}

function validateStudentData_(data) {
  if (!data || typeof data !== 'object') throw new Error('登録データがありません。');
  if (ALLOWED_CAMPUSES.indexOf(data.campus) === -1) {
    throw new Error('通塾教室を選択してください。');
  }

  [
    'studentName', 'studentKana', 'gender', 'birthdate', 'grade', 'school',
    'parentName', 'parentKana', 'relation', 'zip', 'addr1', 'addr2', 'addr3',
    'email', 'mobile'
  ].forEach(function(key) {
    if (data[key] === undefined || data[key] === null || String(data[key]).trim() === '') {
      throw new Error(key + ' は必須です。');
    }
  });
}

function getNextRowByColumn_(sheet, column) {
  const lastRow = Math.max(sheet.getLastRow(), 1);
  const values = sheet.getRange(1, column, lastRow, 1).getDisplayValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] !== '') return i + 2;
  }
  return 1;
}

function getMaxNumericValue_(sheet, column) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 1) return 0;
  return sheet.getRange(1, column, lastRow, 1).getValues().reduce(function(max, row) {
    const value = typeof row[0] === 'number' ? row[0] : Number(String(row[0]).trim());
    return Number.isFinite(value) && value > max ? value : max;
  }, 0);
}

function parseLocalDate_(value) {
  // フォーム側は yyyy/mm/dd を送る。互換のため yyyy-mm-dd も受け付ける。
  const match = String(value).match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
  if (!match) throw new Error('生年月日の形式が不正です。');
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (date.getFullYear() !== Number(match[1]) ||
      date.getMonth() !== Number(match[2]) - 1 ||
      date.getDate() !== Number(match[3])) {
    throw new Error('生年月日が不正です。');
  }
  return date;
}

function buildGradeFormula_(row) {
  const birth = 'I' + row;
  // 日本の学年区分は4月1日生まれまでが同学年。4月2日生まれを1学年上にしないため4月1日時点の年齢を使う。
  const schoolYearDate = 'DATE(YEAR(TODAY())-IF(TODAY()<DATE(YEAR(TODAY()),4,1),1,0),4,1)';
  const age = 'DATEDIF(' + birth + ',' + schoolYearDate + ',"Y")';
  const grades = ['未就学', '小１', '小２', '小３', '小４', '小５', '小６',
    '中１', '中２', '中３', '高１', '高２', '高３', '大１', '大２', '大３', '大４'];
  let expression = '"既卒"';
  for (let value = 21; value >= 6; value--) {
    expression = 'IF(' + age + '=' + value + ',"' + grades[value - 5] + '",' + expression + ')';
  }
  expression = 'IF(' + age + '<6,"未就学",' + expression + ')';
  return '=IF(' + birth + '="","",IFERROR(' + expression + ',"要確認"))';
}

function kanaToRomaji_(input) {
  let kana = String(input || '').trim()
    .replace(/[ぁ-ゖ]/g, function(char) {
      return String.fromCharCode(char.charCodeAt(0) + 0x60);
    })
    .replace(/[ー\s・]/g, '');

  const map = {
    'キャ':'kya','キュ':'kyu','キョ':'kyo','シャ':'sha','シュ':'shu','ショ':'sho',
    'チャ':'cha','チュ':'chu','チョ':'cho','ニャ':'nya','ニュ':'nyu','ニョ':'nyo',
    'ヒャ':'hya','ヒュ':'hyu','ヒョ':'hyo','ミャ':'mya','ミュ':'myu','ミョ':'myo',
    'リャ':'rya','リュ':'ryu','リョ':'ryo','ギャ':'gya','ギュ':'gyu','ギョ':'gyo',
    'ジャ':'ja','ジュ':'ju','ジョ':'jo','ビャ':'bya','ビュ':'byu','ビョ':'byo',
    'ピャ':'pya','ピュ':'pyu','ピョ':'pyo','ティ':'ti','ディ':'di','ファ':'fa',
    'フィ':'fi','フェ':'fe','フォ':'fo','ウィ':'wi','ウェ':'we','ウォ':'wo',
    'ア':'a','イ':'i','ウ':'u','エ':'e','オ':'o','カ':'ka','キ':'ki','ク':'ku','ケ':'ke','コ':'ko',
    'サ':'sa','シ':'shi','ス':'su','セ':'se','ソ':'so','タ':'ta','チ':'chi','ツ':'tsu','テ':'te','ト':'to',
    'ナ':'na','ニ':'ni','ヌ':'nu','ネ':'ne','ノ':'no','ハ':'ha','ヒ':'hi','フ':'fu','ヘ':'he','ホ':'ho',
    'マ':'ma','ミ':'mi','ム':'mu','メ':'me','モ':'mo','ヤ':'ya','ユ':'yu','ヨ':'yo',
    'ラ':'ra','リ':'ri','ル':'ru','レ':'re','ロ':'ro','ワ':'wa','ヲ':'o','ン':'n',
    'ガ':'ga','ギ':'gi','グ':'gu','ゲ':'ge','ゴ':'go','ザ':'za','ジ':'ji','ズ':'zu','ゼ':'ze','ゾ':'zo',
    'ダ':'da','ヂ':'ji','ヅ':'zu','デ':'de','ド':'do','バ':'ba','ビ':'bi','ブ':'bu','ベ':'be','ボ':'bo',
    'パ':'pa','ピ':'pi','プ':'pu','ペ':'pe','ポ':'po','ヴ':'vu'
  };

  let result = '';
  let geminate = false;
  for (let i = 0; i < kana.length;) {
    if (kana[i] === 'ッ') {
      geminate = true;
      i++;
      continue;
    }
    const pair = kana.slice(i, i + 2);
    const romaji = map[pair] || map[kana[i]] || '';
    if (geminate && romaji) result += romaji[0];
    result += romaji;
    geminate = false;
    i += map[pair] ? 2 : 1;
  }
  return result;
}
