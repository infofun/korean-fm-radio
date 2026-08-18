const fs = require('fs');

// 서버 차단을 막기 위해 일반 브라우저 및 KBS 홈페이지 위장 헤더
const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://onair.kbs.co.kr/',
    'Origin': 'https://onair.kbs.co.kr',
    'Accept': 'application/json, text/plain, */*'
};

// KBS 스트리밍 주소 추출 (JSON)
async function getKBS(code) {
    try {
        // 임의의 한국 통신사 IP로 위장하여 해외 차단 우회 시도
        const kbsHeaders = {
            ...headers,
            'X-Forwarded-For': '211.232.120.13', 
            'X-Real-IP': '211.232.120.13'
        };

        const res = await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${code}`, { headers: kbsHeaders });
        
        // JSON 응답을 먼저 텍스트로 받아 내용 확인 (디버깅용)
        const text = await res.text();
        const data = JSON.parse(text);

        // 정상적인 구조(channel.item)가 없을 경우 서버 응답 내용을 통째로 출력
        if (!data.channel || !data.channel.item) {
            console.error(`[디버그] KBS ${code} 비정상 응답 데이터:`, text);
            return "";
        }

        return data.channel.item[0].service_url;
    } catch (e) {
        console.error(`KBS ${code} 파싱 실패:`, e.message);
        return "";
    }
}

// MBC 스트리밍 주소 추출 (Plain Text)
async function getMBC(code) {
    try {
        const res = await fetch(`https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=${code}`, { headers });
        return (await res.text()).trim();
    } catch (e) {
        console.error(`MBC ${code} 파싱 실패:`, e.message);
        return "";
    }
}

// SBS 스트리밍 주소 추출 (Plain Text)
async function getSBS(code) {
    try {
        const res = await fetch(`https://apis.sbs.co.kr/play-api/1.0/livestream/${code}pc/${code}fm?protocol=hls&ssl=Y`, { headers });
        return (await res.text()).trim();
    } catch (e) {
        console.error(`SBS ${code} 파싱 실패:`, e.message);
        return "";
    }
}

async function generateM3U() {
    let m3u = "#EXTM3U\n\n";
    console.log("스트리밍 주소 파싱 시작...");

    const kbs1 = await getKBS('21');
    const kbs2fm = await getKBS('25'); // 쿨FM
    const mbcFm4u = await getMBC('mfm');
    const sbsPower = await getSBS('power');

    // 정상적으로 파싱된 주소만 플레이리스트에 조립
    if (kbs1) m3u += `#EXTINF:-1 group-title="지상파", KBS 1라디오\n${kbs1}\n\n`;
    if (kbs2fm) m3u += `#EXTINF:-1 group-title="지상파", KBS 쿨FM\n${kbs2fm}\n\n`;
    if (mbcFm4u) m3u += `#EXTINF:-1 group-title="지상파", MBC FM4U\n${mbcFm4u}\n\n`;
    if (sbsPower) m3u += `#EXTINF:-1 group-title="지상파", SBS 파워FM\n${sbsPower}\n\n`;
    
    // 토큰이 필요 없는 고정 주소 추가
    m3u += `#EXTINF:-1 group-title="종교", CBS 음악FM\nhttps://aac.cbs.co.kr/cbs981/_definst_/cbs981.stream/playlist.m3u8\n\n`;

    fs.writeFileSync('radio.m3u', m3u);
    console.log("M3U 파일 생성 완료");
}

generateM3U();
