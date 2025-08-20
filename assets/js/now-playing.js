(function () {
  const ENDPOINT = 'https://e2rd0.com/api/now-playing/';
  const REFRESH_MS = 15000;

  const bar = document.getElementById('np-bar');
  const link = document.getElementById('np-link');
  const title = document.getElementById('np-title');
  const artist = document.getElementById('np-artist');
  const closeBtn = document.getElementById('np-close');

  let closedThisSession = false;
  let last = { timePlayed: 0, timeTotal: 0, isPlaying: false, ts: Date.now() };

  async function fetchNowPlaying() {
    try {
      const res = await fetch(ENDPOINT, { cache: 'no-store' });
      if (res.status === 204) return { isPlaying: false };
      if (!res.ok) throw new Error('Unable to fetch');
      return await res.json();
    } catch {
      return { isPlaying: false };
    }
  }

  function setProgress(pct) {
    bar.style.setProperty('--np-progress', pct.toFixed(2) + '%');
  }

  function render(data) {
    if (closedThisSession || !data?.isPlaying) {
      bar.hidden = true;
      bar.classList.remove('show');
      setProgress(0);
      return;
    }

    link.href = data.songUrl || '#';
    title.textContent = data.title || 'Canción desconocida';
    artist.textContent = data.artist || 'Artista desconocido';

    const total = Number(data.timeTotal || 0);
    const played = Number(data.timePlayed || 0);
    const pct = total > 0 ? (played / total) * 100 : 0;
    setProgress(pct);

    bar.hidden = false;
    bar.classList.add('show');

    last = { timePlayed: played, timeTotal: total, isPlaying: !!data.isPlaying, ts: Date.now() };
  }

  function tick() {
    if (!last.isPlaying || !bar.classList.contains('show')) return;
    const elapsed = Date.now() - last.ts;
    const played = Math.min(last.timeTotal, last.timePlayed + elapsed);
    const pct = last.timeTotal > 0 ? (played / last.timeTotal) * 100 : 0;
    setProgress(Math.max(0, Math.min(100, pct)));
    requestAnimationFrame(tick);
  }

  async function start() {
    const d = await fetchNowPlaying();
    render(d);
    tick();
    setInterval(async () => {
      const nd = await fetchNowPlaying();
      render(nd);
      last.ts = Date.now();
    }, REFRESH_MS);
  }

  closeBtn.addEventListener('click', () => {
    closedThisSession = true;
    bar.remove();
  });


  (async () => {
    try {
      await start();
    } catch {
      return;
    }
  })();
})();
