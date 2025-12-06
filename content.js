const MY_DATA = {
    name: "佐野 龍太郎" // ここは書き換えてOK
};

console.log("Lazy Entry: 開始します...");

const inputs = document.querySelectorAll('input');
console.log(`Lazy Entry: 合計 ${inputs.length} 個の入力欄が見つかりました`);

let foundCount = 0;

inputs.forEach(input => {
    // すべての入力欄の情報をコンソールに出す（デバッグ用）
    // サイト側でどんな name や id が使われているか確認できます
    console.log(`見つけた入力欄 - type: ${input.type}, name: ${input.name}, id: ${input.id}`);

    const nameAttr = input.name ? input.name.toLowerCase() : "";
    const idAttr = input.id ? input.id.toLowerCase() : "";

    // 条件を少し緩くして、「name」や「sei」「mei」などが含まれていればヒットさせる
    if (nameAttr.includes('name') || nameAttr.includes('sei') || nameAttr.includes('mei') ||
        idAttr.includes('name') || idAttr.includes('sei') || idAttr.includes('mei')) {

        console.log(`★ 当たり！ここに入力します: ${input.name}`);

        // 1. 値を入れる
        input.value = MY_DATA.name;

        // 2. 背景色を変える（視覚的に確認）
        input.style.backgroundColor = "#ffeb3b"; // 黄色

        // 3. 【重要】「入力したよ！」というイベントをサイト側に通知する
        // これがないとReact製サイトなどでは無視されます
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.dispatchEvent(new Event('blur', { bubbles: true }));

        foundCount++;
    }
});

if (foundCount === 0) {
    alert("Lazy Entry: 入力欄が見つかりませんでした。コンソールを確認してください。");
} else {
    alert(`Lazy Entry: ${foundCount} 箇所の入力を試みました！`);
}