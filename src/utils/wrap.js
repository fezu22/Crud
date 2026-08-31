/**
 * GSAP-style wrap utility
 * - Array + index → value (wraps around)
 * - min, max, value → wrapped number
 * - Array only → returns a ready-to-use function
 */
export function wrap(value1, value2, index) {
    // Case 1: Array + index
    if (Array.isArray(value1)) {
        const arr = value1;
        const i = value2;

        if (i === undefined) {
            // Return a function: wrapper(index)
            return (idx) => {
                const len = arr.length;
                if (len === 0) return undefined;
                let n = ((idx % len) + len) % len; // handle negative
                return arr[n];
            };
        }

        const len = arr.length;
        if (len === 0) return undefined;
        let n = ((i % len) + len) % len;
        return arr[n];
    }

    // Case 2: Number range (min, max, value)
    const min = value1;
    const max = value2;
    const val = index;

    if (val === undefined) {
        // Return a function
        return (v) => {
            const range = max - min;
            if (range === 0) return min;
            let n = ((v - min) % range + range) % range;
            return n + min;
        };
    }

    const range = max - min;
    if (range === 0) return min;
    let n = ((val - min) % range + range) % range;
    return n + min;
}