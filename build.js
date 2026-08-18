const fs = require('fs');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': 'https://onair.kbs.co.kr/',
    'Origin': 'https://onair.kbs.co.kr',
    'Accept': 'application/json, text/plain, */*'
};

const GITHUB_ID = "infofun"; 
const BASE_URL = `https://raw.githubusercontent.com/${GITHUB_ID}/korean-fm-radio/main/logos`;

// 주파수 및 지정된 파일명으로 로고 매핑
const logos = {
    kbs2fm: `${BASE_URL}/89.1.png`,
    mbcfm4u: `${BASE_URL}/91.9.png`,
    kbs1fm: `${BASE_URL}/93.1.png`,
    ytn: `${BASE_URL}/94.5.png`,
    tbs: `${BASE_URL}/95.1.png`,
    mbcsfm: `${BASE_URL}/95.9.png`,
    kookbang: `${BASE_URL}/96.7.png`,
    kbs1: `${BASE_URL}/97.3.png`,
    gugak: `${BASE_URL}/99.1.png`,
    obs: `${BASE_URL}/99.9.png`,
    tbn: `${BASE_URL}/100.5.png`,
    tbsefm: `${BASE_URL}/101.3.png`,
    sbslove: `${BASE_URL}/103.5.png`,
    ebs: `${BASE_URL}/104.5.png`,
    kbs3: `${BASE_URL}/104.9.png`,
    kbs2: `${BASE_URL}/106.1.png`,
    sbspower: `${BASE_URL}/107.7.png`,
    mbcChm: `${BASE_URL}/mbc_all_that_music.png`,
    sbsDmb: `${BASE_URL}/sbs_gorealra_m.png`
};

async function getKBS(code) {
    try {
        const kbsHeaders = { ...headers, 'X-Forwarded-For': '211.232.120.13', 'X-Real-IP': '211.232.120.13' };
        const res = await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${code}`, { headers: kbsHeaders });
        if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
        const data = await res.json();
        if (!data.channel_item || data.channel_item.length === 0) return "";
        return data.channel_item[0].service_url;
    } catch (e) {
        console.error(`KBS ${code} 파싱 실패:`, e.message);
        return "";
    }
}

async function getMBC(code) {
    try {
        const res = await fetch(`https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=${code}`, { headers });
        return (await res.text()).trim();
    } catch (e) {
        return "";
    }
}

async function getSBS(code) {
    try {
        const channelSuffix = (code === 'sbsdmb') ? '' : 'fm';
        const res = await fetch(`https://apis.sbs.co.kr/play-api/1.0/livestream/${code}pc/${code}${channelSuffix}?protocol=hls&ssl=Y`, { headers });
        return (await res.text()).trim();
    } catch (e) {
        return "";
    }
}

async function generateM3U() {
    let m3u = "#EXTM3U\n\n";
    console.log("스트리밍 주소 파싱 시작 (주파수 파일명 매핑)...");

    const kbs1 = await getKBS('21');   
    const kbs2 = await getKBS('22');   
    const kbs3 = await getKBS('23');   
    const kbs1fm = await getKBS('24'); 
    const kbs2fm = await getKBS('25'); 

    const mbcSfm = await getMBC('sfm'); 
    const mbcFm4u = await getMBC('mfm'); 
    const mbcChm = await getMBC('chm'); 

    const sbsLove = await getSBS('love');   
    const sbsPower = await getSBS('power'); 
    const sbsDmb = await getSBS('sbsdmb'); 

    // ----- 수도권 FM 주파수 오름차순 정렬 -----
    
    if (kbs2fm) m3u += `#EXTINF:-1 tvg-logo="${logos.kbs2fm}" group-title="지상파", KBS 2FM (쿨FM) [89.1]\n${kbs2fm}\n\n`;
    if (mbcFm4u) m3u += `#EXTINF:-1 tvg-logo="${logos.mbcfm4u}" group-title="지상파", MBC FM4U [91.9]\n${mbcFm4u}\n\n`;
    if (kbs1fm) m3u += `#EXTINF:-1 tvg-logo="${logos.kbs1fm}" group-title="지상파", KBS 1FM (클래식FM) [93.1]\n${kbs1fm}\n\n`;
    
    m3u += `#EXTINF:-1 tvg-logo="${logos.ytn}" group-title="뉴스/교양", YTN 라디오 [94.5]\nhttps://radiolive.ytn.co.kr/radio/_definst_/20211118_fmlive/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 tvg-logo="${logos.tbs}" group-title="뉴스/교양", TBS FM [95.1]\nhttps://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_fm_web_360.smil/playlist.m3u8\n\n`;
    
    if (mbcSfm) m3u += `#EXTINF:-1 tvg-logo="${logos.mbcsfm}" group-title="지상파", MBC 표준FM [95.9]\n${mbcSfm}\n\n`;
    
    m3u += `#EXTINF:-1 tvg-logo="${logos.kookbang}" group-title="공공", 국방FM [96.7]\nhttps://mediaworks.dema.mil.kr/live_edge/audio.sdp/playlist.m3u8\n\n`;
    
    if (kbs1) m3u += `#EXTINF:-1 tvg-logo="${logos.kbs1}" group-title="지상파", KBS 1라디오 [97.3]\n${kbs1}\n\n`;
    
    m3u += `#EXTINF:-1 tvg-logo="${logos.gugak}" group-title="음악", 국악방송 [99.1]\nhttps://mgugaklive.nowcdn.co.kr/gugakradio/gugakradio.stream/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 tvg-logo="${logos.obs}" group-title="뉴스/교양", OBS 라디오 [99.9]\nhttps://vod3.obs.co.kr:444/live/obsstream1/radio.stream/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 tvg-logo="${logos.tbn}" group-title="뉴스/교양", TBN 경인교통방송 [100.5]\nhttp://radio2.tbn.or.kr:1935/gyeongin/myStream/playlist.m3u8\n\n`;
    m3u += `#EXTINF:-1 tvg-logo="${logos.tbsefm}" group-title="뉴스/교양", TBS eFM (영어방송) [101.3]\nhttps://cdnfm.tbs.seoul.kr/tbs/_definst_/tbs_efm_web_360.smil/playlist.m3u8\n\n`;
    
    if (sbsLove) m3u += `#EXTINF:-1 tvg-logo="${logos.sbslove}" group-title="지상파", SBS 러브FM [103.5]\n${sbsLove}\n\n`;
    
    m3u += `#EXTINF:-1 tvg-logo="${logos.ebs}" group-title="교육", EBS FM [104.5]\nhttps://ebsonair.ebs.co.kr/fmradiofamilypc/familypc1m/playlist.m3u8\n\n`;
    
    if (kbs3) m3u += `#EXTINF:-1 tvg-logo="${logos.kbs3}" group-title="지상파", KBS 3라디오 [104.9]\n${kbs3}\n\n`;
    if (kbs2) m3u += `#EXTINF:-1 tvg-logo="${logos.kbs2}" group-title="지상파", KBS 2라디오 (해피FM) [106.1]\n${kbs2}\n\n`;
    if (sbsPower) m3u += `#EXTINF:-1 tvg-logo="${logos.sbspower}" group-title="지상파", SBS 파워FM [107.7]\n${sbsPower}\n\n`;

    // ----- 인터넷 전용 채널 -----
    if (mbcChm) m3u += `#EXTINF:-1 tvg-logo="${logos.mbcChm}" group-title="인터넷 전용", MBC 올댓뮤직\n${mbcChm}\n\n`;
    if (sbsDmb) m3u += `#EXTINF:-1 tvg-logo="${logos.sbsDmb}" group-title="인터넷 전용", SBS 고릴라M\n${sbsDmb}\n\n`;

    fs.writeFileSync('radio.m3u', m3u);
    console.log("M3U 파일 생성 완료 (썸네일 주파수명 매핑 완료)");
}

generateM3U();
