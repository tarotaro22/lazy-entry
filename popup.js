document.addEventListener('DOMContentLoaded', () => {
    const fillBtn = document.getElementById('fillBtn');
    const saveBtn = document.getElementById('saveBtn');
    const statusDiv = document.getElementById('status');

    // --- 1. Load Data ---
    // 保存されたデータを読み込み、フォームにセットする
    chrome.storage.local.get('lazy_entry_profile', (data) => {
        if (data.lazy_entry_profile) {
            const p = data.lazy_entry_profile;

            // Name
            setVal('kanji_sei', p.name?.kanji_sei);
            setVal('kanji_mei', p.name?.kanji_mei);
            setVal('kana_sei', p.name?.kana_sei);
            setVal('kana_mei', p.name?.kana_mei);

            // Birth
            setVal('birth_year', p.birth?.year);
            setVal('birth_month', p.birth?.month);
            setVal('birth_day', p.birth?.day);

            // Address
            setVal('zip_full', p.address?.zip_full);
            setVal('prefecture', p.address?.prefecture);
            setVal('pref_id', p.address?.pref_id);
            setVal('city_street', p.address?.city); // cityフィールドに結合して保存しているのでここに戻す
            setVal('building', p.address?.building);

            // Contact
            setVal('email_main', p.email?.main);
            setVal('mobile_tel_full', p.contact?.mobile_tel_full);
            setVal('home_tel_full', p.contact?.home_tel_full);

            // School
            setVal('school_name', p.school?.name);
            setVal('school_initial', p.school?.initial);
            setVal('school_faculty', p.school?.faculty);
            setVal('school_department', p.school?.department);
            setVal('school_bunri', p.school?.bunri);
            setVal('school_type', p.school?.type);
            setVal('school_from_year', p.school?.from_year);
            setVal('school_from_month', p.school?.from_month);
            setVal('school_to_year', p.school?.to_year);
            setVal('school_to_month', p.school?.to_month);
        }
    });

    // --- 2. Save Data ---
    // フォームの値を検証し、構造化データを作成して保存する
    saveBtn.addEventListener('click', () => {
        // 必須項目の簡易バリデーション
        const requiredIds = ['kanji_sei', 'kanji_mei', 'email_main', 'zip_full', 'city_street'];
        for (const id of requiredIds) {
            const val = getVal(id);
            if (!val) {
                alert("必須項目（氏名、メール、住所など）が未入力です。\n値を入力してください。");
                return;
            }
        }

        // データ加工・構造化
        // Address Split
        const zipFull = getVal('zip_full');
        const zipParts = zipFull.includes('-') ? zipFull.split('-') : [zipFull.slice(0, 3), zipFull.slice(3)];

        // Contact Split
        const mobileFull = getVal('mobile_tel_full');
        const mobileParts = mobileFull.split('-');
        const homeFull = getVal('home_tel_full');
        const homeParts = homeFull.split('-');

        // Profile Object Construction (Deep Nesting)
        const profileData = {
            name: {
                kanji_sei: getVal('kanji_sei'),
                kanji_mei: getVal('kanji_mei'),
                kana_sei: getVal('kana_sei'),
                kana_mei: getVal('kana_mei'),
                // 派生: 結合
                full_kanji: getVal('kanji_sei') + getVal('kanji_mei'),
                full_kana: getVal('kana_sei') + getVal('kana_mei')
            },
            birth: {
                year: getVal('birth_year'),
                month: getVal('birth_month'),
                day: getVal('birth_day'),
                // 派生: パディング
                month_pad: pad(getVal('birth_month')),
                day_pad: pad(getVal('birth_day')),
                full_slashed: `${getVal('birth_year')}/${pad(getVal('birth_month'))}/${pad(getVal('birth_day'))}`,
                full_hyphen: `${getVal('birth_year')}-${pad(getVal('birth_month'))}-${pad(getVal('birth_day'))}`
            },
            address: {
                zip_full: zipFull,
                zip1: zipParts[0] || "",
                zip2: zipParts[1] || "",
                prefecture: getVal('prefecture'),
                pref_id: getVal('pref_id'),
                city: getVal('city_street'), // ユーザー要望によりここに結合
                street: "", // cityにまとめるため空でOK（content.jsはcity+streetを見る）
                building: getVal('building'),
                full: getVal('prefecture') + getVal('city_street') + getVal('building')
            },
            contact: {
                email_main: getVal('email_main'), // To maintain old logic if needed, but nesting is better
                // Nested structure strictly for contact
                mobile_tel_full: mobileFull,
                mobile_tel1: mobileParts[0] || "",
                mobile_tel2: mobileParts[1] || "",
                mobile_tel3: mobileParts[2] || "",
                home_tel_full: homeFull,
                home_tel1: homeParts[0] || "",
                home_tel2: homeParts[1] || "",
                home_tel3: homeParts[2] || ""
            },
            email: {
                main: getVal('email_main'),
                confirm: getVal('email_main')
            },
            school: {
                name: getVal('school_name'),
                initial: getVal('school_initial'),
                faculty: getVal('school_faculty'),
                department: getVal('school_department'),
                bunri: getVal('school_bunri'),
                type: getVal('school_type'),
                from_year: getVal('school_from_year'),
                from_month: getVal('school_from_month'),
                from_month_pad: pad(getVal('school_from_month')),
                to_year: getVal('school_to_year'),
                to_month: getVal('school_to_month'),
                to_month_pad: pad(getVal('school_to_month'))
            }
        };

        // Save
        chrome.storage.local.set({ lazy_entry_profile: profileData }, () => {
            statusDiv.textContent = "保存しました！";
            statusDiv.style.color = "#10b981";
            setTimeout(() => statusDiv.textContent = "", 3000);
        });
    });

    // --- 3. Auto Fill ---
    fillBtn.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "autoFill" }).catch(err => {
                console.error(err);
                alert("エラー: ページをリロードしてから再試行してください。");
            });
        }
    });

    // Helpers
    function getVal(id) {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    }

    function setVal(id, val) {
        const el = document.getElementById(id);
        if (el && val !== undefined && val !== null) {
            el.value = val;
        }
    }

    function pad(num) {
        if (!num) return "";
        return num.toString().padStart(2, '0');
    }
});