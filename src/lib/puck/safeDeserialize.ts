export function safeDeserialize(input: any) {
    // minimal safety: reject __proto__ or constructor keys
    const reject: any = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj;
        if ('__proto__' in obj || 'constructor' in obj) return null;
        if (Array.isArray(obj)) return obj.map(reject);
        const out: any = {};
        for (const k of Object.keys(obj)) {
            if (k === '__proto__' || k === 'constructor') continue;
            const v = obj[k];
            out[k] = (typeof v === 'object') ? reject(v) : v;
        }
        return out;
    };
    return reject(input);
}
