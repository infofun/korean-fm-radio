const fs = require('fs');

// KBS 스트리밍 주소 추출 (JSON)
async function getKBS(code) {
    const res = await fetch(`https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/${code}`);
    const data = await res.json();
    return data.channel.item[0].service_url;
}

// MBC 스트리밍 주소 추출 (Plain Text)
async function getMBC(code) {
    const res = await fetch(`https://sminiplay.imbc.com/aacplay.ashx?agent=webapp&channel=${code}`);
    return (await res.text()).trim();
}

// SBS 스트리밍 주소 추출 (Plain Text)
async function getSBS(code) {
    const res = await fetch(`https://apis.sbs.co.kr/play-api/1.0/livestream/${code}pc/${code}fm?protocol=hls&ssl=Y`);
    return (await res.text()).trim();
}

async function generateM3U() {
    let m3u = "#EXTM3U\n\n";

    try {
        // 방송사별 최신 토큰 M3U8 가져오기
        const kbs1 = await getKBS('21');
        const kbs2fm = await getKBS('25'); // 쿨FM
        const mbcFm4u = await getMBC('mfm');
        const sbsPower = await getSBS('power');

        // 플레이리스트 데이터 조립
        m3u += `#EXTINF:-1 group-title="지상파", KBS 1라디오\n${kbs1}\n\n`;
        m3u += `#EXTINF:-1 group-title="지상파", KBS 쿨FM\n${kbs2fm}\n\n`;
        m3u += `#EXTINF:-1 group-title="지상파", MBC FM4U\n${mbcFm4u}\n\n`;
        m3u += `#EXTINF:-1 group-title="지상파", SBS 파워FM\n${sbsPower}\n\n`;
        
        // 토큰이 필요 없는 고정 주소 (CBS 등) 추가
        m3u += `#EXTINF:-1 group-title="종교", CBS 음악FM\nhttps://aac.cbs.co.kr/cbs981/_definst_/cbs981.stream/playlist.m3u8\n\n`;

        // 파일로 쓰기
        fs.writeFileSync('radio.m3u', m3u);
        console.log("M3U 파일 생성 완료");
    } catch (error) {
        console.error("오류 발생:", error);
        process.exit(1);
    }
}

generateM3U();