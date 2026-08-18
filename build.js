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
        const kbsHeaders = {
            ...headers,
            'X-Forwarded-For': '211.232.120.13', 
            'X-Real-IP': '211.232.120.13'
        };

        const res = await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${code}`, { headers: kbsHeaders });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        
        const data = await res.json();

        if (!data.channel_item || data.channel_item.length === 0) {
            console.error(`[디버그] KBS ${code} 채널 데이터가 없습니다.`);
            return "";
        }
        return data.channel_item[0].service_url;
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

    // 지상파 3사 동적 주소 파싱
    const kbs1 = await getKBS('21');   // 1라디오
    const kbs2 = await getKBS('22');   // 2라디오 (해피FM)
    const kbs1fm = await getKBS('24'); // 1FM (클래식FM)
    const kbs2fm = await getKBS('25'); // 2FM (쿨FM)

    const mbcSfm = await getMBC('sfm'); // 표준FM
    const mbcFm4u = await getMBC('mfm'); // FM4U
    const mbcChm = await getMBC('chm'); // 올댓뮤직

    const sbsLove = await getSBS('love');   // 러브FM
    const sbsPower = await getSBS('power'); // 파워FM

    // 1. KBS 추가
    if (kbs1) m3u += `#EXTINF:-1 group-title="지상파", KBS 1라디오\n${kbs1}\n\n`;
    if (kbs2) m3u += `#EXTINF:-1 group-title="지상파", KBS 2라디오 (해피FM)\n${kbs2}\n\n`;
    if (kbs1fm) m3u += `#EXTINF:-1 group-title="지상파", KBS 1FM (클래식FM)\n${kbs1fm}\n\n`;
    if (kbs2fm) m3u += `#EXTINF:-1 group-title="지상파", KBS 2FM (쿨FM)\n${kbs2fm}\n\n`;

    // 2. MBC 추가
    if (mbcSfm) m3u += `#EXTINF:-1 group-title="지상파", MBC 표준FM\n${mbcSfm}\n\n`;
    if (mbcFm4u) m3u += `#EXTINF:-1 group-title="지상파", MBC FM4U\n${mbcFm4u}\n\n`;
    if (mbcChm) m3u += `#EXTINF:-1 group-title="지상파", MBC 올댓뮤직\n${mbcChm}\n\n`;

    // 3. SBS 추가
    if (sbsLove) m3u += `#EXTINF:-1 group-title="지상파", SBS 러브FM\n${sbsLove}\n\n`;
    if (sbsPower) m3u += `#EXTINF:-1 group-title="지상파", SBS 파워FM\n${sbsPower}\n\n`;
    
    // 4. 고정 주소 라디오 추가 (종교방송 제외)
    m3u += `#EXTINF:-1 group-title="뉴스/교양", YTN 라디오\nhttps://radiolive.ytn.co.kr/radio/_definst_/20211118_fmlive/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 group-title="뉴스/교양", TBS FM\nhttps://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_fm_web_360.smil/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 group-title="뉴스/교양", TBS eFM (영어방송)\nhttps://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_efm_web_360.smil/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 group-title="교육", EBS FM\nhttps://ebsonair.ebs.co.kr/fmradiofamilypc/familypc1m/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 group-title="공공", 국방FM\nhttps://mediaworks.dema.mil.kr/live_edge/audio.sdp/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 group-title="음악", 국악방송\nhttps://mgugaklive.nowcdn.co.kr/gugakradio/gugakradio.stream/playlist.m3u8\n\n`;

    fs.writeFileSync('radio.m3u', m3u);
    console.log("M3U 파일 생성 완료 (총 15개 채널)");
}

generateM3U();
