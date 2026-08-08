const SUPABASE_URL = "https://bhzyifhxammbtwudprqg.supabase.co/rest/v1/"; 
const SUPABASE_KEY = "sb_publishable_RnJsAcc9aE7ZYnGp_QFX1Q_9hctVOJ2";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let items = [];
let currentIndex = 0;
let userRatings = {};

async function loadData() {
    let { data, error } = await supabase.from('comparison_items').select('*').order('item_number', { ascending: true });
    if (!error && data.length > 0) {
        items = data;
    }
}
loadData();

function startEvaluation() {
    if (items.length === 0) {
        alert("جاري تحميل البيانات، يرجى الانتظار ثواني بسيطة...");
        return;
    }
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');
    renderQuestion();
}

function renderQuestion() {
    const item = items[currentIndex];
    document.getElementById('step-counter').innerText = `وجه المقارنة ${currentIndex + 1} من ${items.length}`;
    const progress = Math.round(((currentIndex + 1) / items.length) * 100);
    document.getElementById('progress-percent').innerText = `${progress}%`;
    document.getElementById('progress-bar').style.width = `${progress}%`;

    document.getElementById('aspect-title').innerText = `${item.item_number}. ${item.aspect}`;
    document.getElementById('pd-desc').innerText = item.pd_desc;
    document.getElementById('hd-desc').innerText = item.hd_desc;

    if (!userRatings[item.item_number]) {
        userRatings[item.item_number] = { pd: 0, hd: 0 };
    }

    renderRatingButtons('pd-rating-btns', 'pd', item.item_number);
    renderRatingButtons('hd-rating-btns', 'hd', item.item_number);

    document.getElementById('prev-btn').disabled = currentIndex === 0;
    document.getElementById('next-btn').innerText = currentIndex === items.length - 1 ? 'إنهاء وحساب النتيجة' : 'التالي';
}

function renderRatingButtons(containerId, type, itemNum) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    for (let i = 1; i <= 5; i++) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `w-full py-1.5 text-xs font-bold rounded border transition ${userRatings[itemNum][type] === i ? (type === 'pd' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-blue-600 text-white border-blue-600') : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`;
        btn.innerText = i;
        btn.onclick = () => {
            userRatings[itemNum][type] = i;
            renderRatingButtons(containerId, type, itemNum);
        };
        container.appendChild(btn);
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        renderQuestion();
    }
}

function nextQuestion() {
    const itemNum = items[currentIndex].item_number;
    if (userRatings[itemNum].pd === 0 || userRatings[itemNum].hd === 0) {
        alert("يرجى اختيار تقييم لكلا الخيارين للانتشار للخطوة التالية.");
        return;
    }

    if (currentIndex < items.length - 1) {
        currentIndex++;
        renderQuestion();
    } else {
        calculateAndShowResult();
    }
}

async function calculateAndShowResult() {
    let pdTotal = 0;
    let hdTotal = 0;

    items.forEach(item => {
        const r = userRatings[item.item_number];
        pdTotal += r.pd;
        hdTotal += r.hd;
    });

    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    document.getElementById('pd-total').innerText = pdTotal;
    document.getElementById('hd-total').innerText = hdTotal;

    const pdCard = document.getElementById('pd-score-card');
    const hdCard = document.getElementById('hd-score-card');
    const recBox = document.getElementById('recommendation-box');

    let preferred = pdTotal >= hdTotal ? 'الغسيل البريتوني' : 'الغسيل الدموي';

    if (pdTotal >= hdTotal) {
        pdCard.className = "p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800";
        hdCard.className = "p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-400";
        recBox.className = "p-5 rounded-xl mb-6 text-right bg-emerald-100/60 border border-emerald-300 text-emerald-900";
        recBox.innerHTML = `<h4 class="font-bold text-lg mb-1">الخيار الموصى به بناءً على تقييمك: الغسيل البريتوني</h4><p class="text-sm">حصل الغسيل البريتوني على مجموع نقاط أعلى (${pdTotal} نقطة)، وهو الخيار الأنسب لنمط حياتك وتفضيلاتك شخصياً.</p>`;
    } else {
        hdCard.className = "p-4 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-800";
        pdCard.className = "p-4 rounded-xl border-2 border-slate-200 bg-white text-slate-400";
        recBox.className = "p-5 rounded-xl mb-6 text-right bg-blue-100/60 border border-blue-300 text-blue-900";
        recBox.innerHTML = `<h4 class="font-bold text-lg mb-1">الخيار الموصى به بناءً على تقييمك: الغسيل الدموي</h4><p class="text-sm">حصل الغسيل الدموي على مجموع نقاط أعلى (${hdTotal} نقطة)، وهو الخيار الأنسب لتفضيلاتك شخصياً.</p>`;
    }

    const patientName = document.getElementById('patient-name').value || 'مريض غير مسجل';
    await supabase.from('patient_evaluations').insert([
        {
            patient_name: patientName,
            pd_total_score: pdTotal,
            hd_total_score: hdTotal,
            preferred_modality: preferred,
            ratings_json: userRatings
        }
    ]);
}

async function showAdminLogin() {
    const pwd = prompt("ادخل كلمة مرور المشرف:");
    if (pwd === "admin123") {
        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('admin-screen').classList.remove('hidden');
        
        let { data } = await supabase.from('patient_evaluations').select('*').order('created_at', { ascending: false });
        let html = `<h3 class="font-bold mb-3">إجمالي التقييمات المسجلة (${data ? data.length : 0}):</h3><div class="space-y-2">`;
        
        if (data && data.length > 0) {
            data.forEach(p => {
                html += `<div class="p-3 bg-slate-50 border rounded flex justify-between">
                    <div><strong>${p.patient_name}</strong> - التفضيل: <span class="font-bold text-emerald-700">${p.preferred_modality}</span></div>
                    <div class="text-xs text-slate-400">بريتوني: ${p.pd_total_score} | دموي: ${p.hd_total_score}</div>
                </div>`;
            });
        } else {
            html += `<p>لا توجد تقييمات مسجلة بعد.</p>`;
        }
        html += `</div>`;
        document.getElementById('admin-content').innerHTML = html;
    } else if (pwd) {
        alert("كلمة المرور غير صحيحة");
    }
}
