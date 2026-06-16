/**
 * 看護師伴走型「誰にも言えない心の整理室」
 * 予約フォーム → スプレッドシート 受け取り用 GAS
 *
 * ▼ 使い方（初回セットアップ）
 *  1. 保存先にしたい Google スプレッドシートを開く
 *  2. メニュー「拡張機能」→「Apps Script」を開く
 *  3. このコードを丸ごと貼り付けて保存
 *  4. （任意）下の NOTIFY_EMAIL に通知を受け取りたいメールアドレスを設定
 *  5. メニュー「デプロイ」→「新しいデプロイ」
 *       - 種類: ウェブアプリ
 *       - 次のユーザーとして実行: 自分
 *       - アクセスできるユーザー: 全員
 *  6. 発行された「ウェブアプリのURL（/exec で終わるもの）」をコピーし、
 *     script.js の GAS_ENDPOINT に貼り付ける
 *
 * ※ コードを修正したら、必ず「デプロイを管理」→ 鉛筆 →「新バージョン」で再デプロイしてください。
 */

// 書き込み先シート名（無ければ自動作成されます）
const SHEET_RESERVATION = 'お申し込み';   // 予約フォーム
const SHEET_INQUIRY = 'お問い合わせ';      // お問い合わせフォーム

// 申し込み・問い合わせがあったときに通知を受け取るメール（不要なら '' のままでOK）
const NOTIFY_EMAIL = '';

/**
 * フォームからの POST を受け取る
 * data.formType で「予約(reservation)」と「お問い合わせ(inquiry)」を振り分けます。
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000); // 同時送信での行ずれを防止

  try {
    const data = JSON.parse(e.postData.contents);

    if (data.formType === 'inquiry') {
      saveInquiry_(data);
    } else {
      saveReservation_(data);
    }

    // メール通知（設定されている場合のみ）
    if (NOTIFY_EMAIL) {
      sendNotify_(data);
    }

    return jsonOutput_({ result: 'success' });
  } catch (err) {
    return jsonOutput_({ result: 'error', message: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * 予約フォームの内容をシートに保存
 */
function saveReservation_(data) {
  const sheet = getSheet_(SHEET_RESERVATION);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '受付日時',
      'お名前/ニックネーム',
      'メールアドレス',
      '相談方法',
      'ご希望日時',
      'ご相談内容',
      '送信ページ',
    ]);
  }
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.method || '',
    data.preferredDate || '',
    data.message || '',
    data.pageUrl || '',
  ]);
}

/**
 * お問い合わせフォームの内容をシートに保存
 */
function saveInquiry_(data) {
  const sheet = getSheet_(SHEET_INQUIRY);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '受付日時',
      'お名前',
      'メールアドレス',
      '会社名',
      '電話番号',
      'お問い合わせ内容',
      '送信ページ',
    ]);
  }
  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.company || '',
    data.phone || '',
    data.message || '',
    data.pageUrl || '',
  ]);
}

/**
 * 動作確認用（ブラウザでURLを開いたときに表示される）
 */
function doGet() {
  return jsonOutput_({ result: 'ok', message: 'エンドポイントは正常に動作しています。' });
}

/* ----------------- 内部関数 ----------------- */

function getSheet_(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}

function sendNotify_(data) {
  let subject, body;
  if (data.formType === 'inquiry') {
    subject = '【心の整理室】新しいお問い合わせ';
    body =
      'フォームから新しいお問い合わせがありました。\n\n' +
      'お名前: ' + (data.name || '') + '\n' +
      'メールアドレス: ' + (data.email || '') + '\n' +
      '会社名: ' + (data.company || '') + '\n' +
      '電話番号: ' + (data.phone || '') + '\n' +
      'お問い合わせ内容:\n' + (data.message || '') + '\n\n' +
      '送信ページ: ' + (data.pageUrl || '');
  } else {
    subject = '【心の整理室】新しい初回相談のお申し込み';
    body =
      'フォームから新しいお申し込みがありました。\n\n' +
      'お名前/ニックネーム: ' + (data.name || '') + '\n' +
      'メールアドレス: ' + (data.email || '') + '\n' +
      '相談方法: ' + (data.method || '') + '\n' +
      'ご希望日時: ' + (data.preferredDate || '') + '\n' +
      'ご相談内容:\n' + (data.message || '') + '\n\n' +
      '送信ページ: ' + (data.pageUrl || '');
  }
  MailApp.sendEmail(NOTIFY_EMAIL, subject, body);
}

function jsonOutput_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
