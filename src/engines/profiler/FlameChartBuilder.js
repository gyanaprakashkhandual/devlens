export class FlameChartBuilder {
    build(profileData) {
        if (!profileData || !profileData.functions) return { frames: [], totalDuration: 0 };

        const frames = profileData.functions.map((fn, i) => ({
            name: fn.name,
            start: i * 10,
            duration: 10 + Math.random() * 20,
            depth: 0,
            line: fn.line,
            snippet: fn.snippet,
            color: this.#colorForName(fn.name),
        }));

        frames.sort((a, b) => a.start - b.start);

        const totalDuration = frames.reduce((max, f) => Math.max(max, f.start + f.duration), 0);
        return { frames, totalDuration };
    }

    render(canvas, data, options = {}) {
        if (!canvas || !data.frames.length) return;
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const { scrollX = 0, zoom = 1 } = options;

        ctx.clearRect(0, 0, width, height);

        const rowH = 24;
        const timeScale = (width / Math.max(data.totalDuration, 1)) * zoom;

        for (const frame of data.frames) {
            const x = (frame.start - scrollX) * timeScale;
            const w = Math.max(frame.duration * timeScale - 1, 2);
            const y = frame.depth * rowH;

            if (x + w < 0 || x > width) continue;

            ctx.fillStyle = frame.color;
            ctx.fillRect(x, y, w, rowH - 2);

            if (w > 40) {
                ctx.fillStyle = '#fff';
                ctx.font = '11px monospace';
                ctx.fillText(frame.name, x + 4, y + 15, w - 8);
            }
        }
    }

    #colorForName(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 50%)`;
    }
}