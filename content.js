/**
 * Lazy Entry - Content Script
 * 就活サイトのES入力を自動化する
 */

/**
 * 1. User Profile Data
 * ユーザーの基本情報（ダミーデータ）
 */
const MY_PROFILE = {
    name: {
        kanji_sei: "山田",
        kanji_mei: "太郎",
        kana_sei: "ヤマダ",
        kana_mei: "タロウ",
        full_kanji: "山田太郎",
        full_kana: "ヤマダタロウ"
    },
    birth: {
        year: "2000",
        month: "1", // 0埋めなし
        day: "1",   // 0埋めなし
        month_pad: "01",
        day_pad: "01",
        full_slashed: "2000/01/01",
        full_hyphen: "2000-01-01"
    },
    address: {
        zip_full: "123-4567",
        zip1: "123",
        zip2: "4567",
        prefecture: "東京都",
        pref_id: "13", // 一般的なJISコードを想定（サイトによるが）
        city: "新宿区",
        street: "西新宿1-1-1",
        building: "試験ビル101",
        full: "東京都新宿区西新宿1-1-1 試験ビル101"
    },
    contact: {
        home_tel_full: "03-1234-5678",
        home_tel1: "03",
        home_tel2: "1234",
        home_tel3: "5678",
        mobile_tel_full: "090-9876-5432",
        mobile_tel1: "090",
        mobile_tel2: "9876",
        mobile_tel3: "5432"
    },
    email: {
        main: "yamada.taro.sample@example.com",
        confirm: "yamada.taro.sample@example.com"
    },
    school: {
        name: "東京大学",
        faculty: "工学部",
        department: "情報工学科",
        bunri: "理系", // 文系 or 理系
        type: "大学", // 大学, 大学院 etc.
        initial: "ト",
        from_year: "2019",
        from_month: "4",
        from_month_pad: "04",
        to_year: "2023",
        to_month: "3",
        to_month_pad: "03"
    }
};

/**
 * 3. Event Dispatching (React Support)
 * ReactやVueなどの仮想DOMフレームワークに対応するためのイベント発火
 */
function setNativeValue(element, value) {
    const valueSetter = Object.getOwnPropertyDescriptor(element, 'value').set;
    const prototype = Object.getPrototypeOf(element);
    const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value').set;

    if (valueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
    } else {
        valueSetter.call(element, value);
    }
}

/**
 * 値を設定し、必要なイベントを発火させる
 */
function fillField(element, value) {
    if (!element || value === undefined || value === null) return;

    // select要素かつoptionに値がない場合はスキップ（無理やり入れても無効になることが多い）
    if (element.tagName.toLowerCase() === 'select') {
        let matched = false;
        for (let option of element.options) {
            if (option.value == value || option.text == value) {
                element.value = option.value;
                matched = true;
                break;
            }
        }
        // 数値の型違い(1 vs "1")や0埋め対応
        if (!matched) {
            // 0埋めあり・なしを試行
            const valStr = String(value);
            const valNum = Number(value);
            const valPad = valStr.length === 1 ? '0' + valStr : valStr;
            const valNoPad = valStr.startsWith('0') && valStr.length > 1 ? valStr.substring(1) : valStr;

            for (let option of element.options) {
                if (option.value == valPad || option.text == valPad ||
                    option.value == valNoPad || option.text == valNoPad) {
                    element.value = option.value;
                    matched = true;
                    break;
                }
            }
        }
    } else if (element.type === 'checkbox' || element.type === 'radio') {
        if (element.value === value) {
            element.checked = true;
        } else {
            // 値でマッチしない場合、特定のチェックボックスロジック（例: 同上）
            return;
        }
    } else {
        // Input text etc.
        // React対応のため、setterを直接呼ぶハックを試みる（動作しない場合もあるため通常代入も行う）
        try {
            setNativeValue(element, value);
        } catch (e) {
            element.value = value;
        }
        element.value = value;
    }

    // イベント発火
    const events = ['input', 'change', 'blur'];
    events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
    });
}

/**
 * 2. Smart Selector Strategy (Fuzzy Matching)
 * 要素の属性から推測して値を入力する
 */
function autoFill() {
    console.log("Lazy Entry: Auto fill started.");

    const inputs = document.querySelectorAll('input, select, textarea');

    inputs.forEach(el => {
        // 隠しフィールドや無効なフィールドは除外
        if (el.type === 'hidden' || el.disabled || el.readOnly) return;

        // 属性情報の取得（小文字化して正規化）
        const name = (el.name || '').toLowerCase();
        const id = (el.id || '').toLowerCase();
        const label = (el.getAttribute('aria-label') || '').toLowerCase();
        const placeholder = (el.placeholder || '').toLowerCase();

        // 周辺のLabelタグのテキストも拾えると精度が上がるが、ここではname/idメインで判定
        const txt = `${name} ${id} ${label} ${placeholder}`;

        // --- 氏名 ---
        if (txt.includes('kanji') || txt.includes('k_') || txt.includes('name')) {
            if (txt.includes('sei') || txt.includes('last') || txt.includes('family')) {
                fillField(el, MY_PROFILE.name.kanji_sei);
            } else if (txt.includes('mei') || txt.includes('first') || (txt.includes('name') && txt.includes('na') && !txt.includes('kana'))) {
                // "kanji_na" のようなパターン
                fillField(el, MY_PROFILE.name.kanji_mei);
            }
        }

        // カナ
        if (txt.includes('kana') || txt.includes('furi')) {
            if (txt.includes('sei') || txt.includes('last')) {
                fillField(el, MY_PROFILE.name.kana_sei);
            } else if (txt.includes('mei') || txt.includes('first') || txt.includes('na')) {
                fillField(el, MY_PROFILE.name.kana_mei);
            }
        }

        // --- 生年月日 ---
        if (txt.includes('birth')) {
            if (txt.includes('year') || txt.includes('_y')) {
                fillField(el, MY_PROFILE.birth.year);
            } else if (txt.includes('month') || txt.includes('_m')) {
                fillField(el, MY_PROFILE.birth.month);
            } else if (txt.includes('day') || txt.includes('_d')) {
                fillField(el, MY_PROFILE.birth.day);
            }
        }

        // --- 住所 ---
        // 郵便番号
        if (txt.includes('zip') || txt.includes('post') || txt.includes('yubin')) {
            // 分割パターン (yubing_h, yubing_l)
            if (txt.includes('_h') || txt.includes('zip1') || txt.includes('post1')) {
                fillField(el, MY_PROFILE.address.zip1);
            } else if (txt.includes('_l') || txt.includes('zip2') || txt.includes('post2')) {
                fillField(el, MY_PROFILE.address.zip2);
            } else {
                // 分割されていない場合（文字制限などで判定すべきだが、とりあえずハイフンありで）
                if (el.maxLength && el.maxLength < 8) {
                    // 短い場合はハイフンなしかもしれないが、とりあえず何もしないか、zip1を入れるか
                    // ここでは安全のためzip_fullを入れる
                    fillField(el, MY_PROFILE.address.zip_full);
                } else {
                    fillField(el, MY_PROFILE.address.zip_full);
                }
            }
        }

        // 都道府県
        if (txt.includes('pref') || txt.includes('ken') || (txt.includes('addr') && txt.includes('1'))) {
            // inputならテキスト、selectならvalueかtext
            if (el.tagName.toLowerCase() === 'select') {
                // 都道府県コードか名称か... fillField内でトライする
                fillField(el, MY_PROFILE.address.prefecture);
                // ダメならidも
                fillField(el, MY_PROFILE.address.pref_id); // 13など
            } else {
                fillField(el, MY_PROFILE.address.prefecture);
            }
        }

        // 市区町村、番地
        if (txt.includes('city') || txt.includes('g1') || txt.includes('shiku')) {
            fillField(el, MY_PROFILE.address.city);
        }
        if (txt.includes('addr') || txt.includes('g2') || txt.includes('ban') || txt.includes('cho') || txt.includes('street')) {
            // g1, g2 パターン (g1=city, g2=street/ban)
            if (!txt.includes('g1')) {
                fillField(el, MY_PROFILE.address.street);
            }
        }
        if (txt.includes('build') || txt.includes('g3') || txt.includes('tate')) {
            fillField(el, MY_PROFILE.address.building);
        }

        // --- 電話番号 ---
        if (txt.includes('tel') || txt.includes('phone') || txt.includes('mobile') || txt.includes('keitai')) {
            // 携帯か自宅か
            let target = MY_PROFILE.contact.home_tel_full;
            let p1 = MY_PROFILE.contact.home_tel1;
            let p2 = MY_PROFILE.contact.home_tel2;
            let p3 = MY_PROFILE.contact.home_tel3;

            if (txt.includes('mobile') || txt.includes('keitai')) {
                target = MY_PROFILE.contact.mobile_tel_full;
                p1 = MY_PROFILE.contact.mobile_tel1;
                p2 = MY_PROFILE.contact.mobile_tel2;
                p3 = MY_PROFILE.contact.mobile_tel3;
            }

            if (txt.includes('_h') || txt.includes('part1') || txt.includes('area')) {
                fillField(el, p1);
            } else if (txt.includes('_m') || txt.includes('part2') || txt.includes('exchange')) {
                fillField(el, p2);
            } else if (txt.includes('_l') || txt.includes('part3') || txt.includes('sub')) {
                fillField(el, p3);
            } else {
                // 分割なし
                fillField(el, target);
            }
        }

        // --- メール ---
        if (txt.includes('mail')) {
            fillField(el, MY_PROFILE.email.main);
        }

        // --- 学校 ---
        if (txt.includes('school') || txt.includes('daigaku') || txt.includes('univ')) {
            // 具体的なパターン
            if (txt.includes('from_y')) fillField(el, MY_PROFILE.school.from_year);
            else if (txt.includes('from_m')) fillField(el, MY_PROFILE.school.from_month);
            else if (txt.includes('to_y')) fillField(el, MY_PROFILE.school.to_year);
            else if (txt.includes('to_m')) fillField(el, MY_PROFILE.school.to_month);

            else if (txt.includes('name') || txt.includes('d_name') || txt.includes('dname')) fillField(el, MY_PROFILE.school.name);
            else if (txt.includes('initial')) fillField(el, MY_PROFILE.school.initial);

            // 学校区分 (kubun -> radio 2:大学 usually)
            if (txt.includes('kubun') && el.type === "radio" && el.value == "2") {
                // 2=大学, 1=大学院 (contextによるが一般的)
                el.checked = true;
                fillField(el, "2");
            }
        }

        // 学部・学科
        if (txt.includes('gakubu') || txt.includes('bname') || txt.includes('faculty')) {
            fillField(el, MY_PROFILE.school.faculty);
        }
        if (txt.includes('gakka') || txt.includes('kname') || txt.includes('department')) {
            fillField(el, MY_PROFILE.school.department);
        }

        // 文理区分
        if ((txt.includes('bunri') || txt.includes('memo4')) && el.type === "radio") {
            // ラジオボタンの値までは推測難しいが、もし文系/理系の文字が近くにあれば...
            // 今回のケースでは理系=10002
            if (el.value === "10002" && MY_PROFILE.school.bunri === "理系") {
                el.checked = true;
                fillField(el, "10002");
            }
            if (el.value === "10001" && MY_PROFILE.school.bunri === "文系") {
                el.checked = true;
                fillField(el, "10001");
            }
        }

        // "現在の連絡先と同じ" (jushosame)
        if (txt.includes('jushosame') && el.type === "checkbox") {
            el.click(); // クリックした方がJSイベントが確実に動く場合が多い
            el.checked = true;
        }

    });

    if (inputs.length === 0) {
        console.warn("Lazy Entry: No inputs found.");
    } else {
        console.log(`Lazy Entry: Processed ${inputs.length} inputs.`);
    }
}

// メッセージリスナー
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "autoFill") {
        autoFill();
        sendResponse({ status: "done" });
    }
});

// デバッグ用: ページロード時にも軽くチェック（自動実行はしない設定だが、開発中は便利）
// console.log("Lazy Entry Content Script Loaded");