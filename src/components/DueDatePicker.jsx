import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import CenteredModal from './CenteredModal';

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const STEPS = ['year', 'month', 'day'];
const STEP_LABELS = {
    year: 'Select year',
    month: 'Select month',
    day: 'Select date',
};

function pad(n) {
    return String(n).padStart(2, '0');
}

function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
}

function parseDate(value) {
    if (value && /^\d{4}-\d{2}-\d{2}/.test(value)) {
        const [y, m, d] = value.split('-').map(Number);
        return { year: y, month: m - 1, day: d };
    }
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth(), day: now.getDate() };
}

export function formatDueDate(value) {
    if (!value) return '';
    const { year, month, day } = parseDate(value);
    const date = new Date(year, month, day);
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/**
 * Bottom-sheet date picker that walks the user through a 3-step
 * flow: pick a year, then a month, then a day. Each step animates
 * (fade + slide) into the next instead of showing everything at once.
 */
export default function DueDatePicker({ visible, value, onClose, onSelect }) {
    const [step, setStep] = useState('year');
    const [year, setYear] = useState(() => parseDate(value).year);
    const [month, setMonth] = useState(() => parseDate(value).month);
    const fade = useRef(new Animated.Value(1)).current;
    const slide = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            const parsed = parseDate(value);
            setYear(parsed.year);
            setMonth(parsed.month);
            setStep('year');
            fade.setValue(1);
            slide.setValue(0);
        }
        // Only reset when the sheet opens.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    function animateTo(nextStep, direction = 1) {
        Animated.parallel([
            Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: true }),
            Animated.timing(slide, {
                toValue: -18 * direction,
                duration: 130,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setStep(nextStep);
            slide.setValue(18 * direction);
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.timing(slide, {
                    toValue: 0,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    }

    function pickYear(y) {
        setYear(y);
        animateTo('month', 1);
    }
    function pickMonth(m) {
        setMonth(m);
        animateTo('day', 1);
    }
    function pickDay(d) {
        onSelect(`${year}-${pad(month + 1)}-${pad(d)}`);
    }
    function goBack() {
        animateTo(step === 'day' ? 'month' : 'year', -1);
    }

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 12 }, (_, i) => currentYear - 2 + i);
    const days = Array.from(
        { length: daysInMonth(year, month) },
        (_, i) => i + 1,
    );
    const stepIndex = STEPS.indexOf(step);

    return (
        <CenteredModal visible={visible} onClose={onClose}>
                <View className="bg-canvas px-6 pb-7 pt-6">
                    <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-line" />

                    <View className="mb-1 flex-row items-center justify-between">
                        <View className="flex-row items-center">
                            {step !== 'year' ? (
                                <TouchableOpacity onPress={goBack} className="mr-3">
                                    <Text className="text-lg font-extrabold text-brand">‹</Text>
                                </TouchableOpacity>
                            ) : null}
                            <Text className="text-lg font-extrabold text-ink">
                                {STEP_LABELS[step]}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <Text className="text-sm font-bold text-muted">Cancel</Text>
                        </TouchableOpacity>
                    </View>

                    <View className="mb-5 mt-3 flex-row">
                        {STEPS.map((s, i) => (
                            <View
                                key={s}
                                className={`mr-2 h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-brand' : 'bg-line'
                                    }`}
                            />
                        ))}
                    </View>

                    <Animated.View
                        style={{ opacity: fade, transform: [{ translateX: slide }] }}
                    >
                        {step === 'year' ? (
                            <View className="flex-row flex-wrap">
                                {years.map(y => (
                                    <TouchableOpacity
                                        key={y}
                                        className={`mb-3 mr-[3%] w-[30%] items-center rounded-2xl border py-3.5 ${y === year
                                                ? 'border-brand bg-brand'
                                                : 'border-line bg-surface'
                                            }`}
                                        onPress={() => pickYear(y)}
                                    >
                                        <Text
                                            className={`font-extrabold ${y === year ? 'text-white' : 'text-ink'
                                                }`}
                                        >
                                            {y}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        {step === 'month' ? (
                            <View className="flex-row flex-wrap">
                                {MONTHS.map((m, i) => (
                                    <TouchableOpacity
                                        key={m}
                                        className={`mb-3 mr-[3%] w-[30%] items-center rounded-2xl border py-3.5 ${i === month
                                                ? 'border-brand bg-brand'
                                                : 'border-line bg-surface'
                                            }`}
                                        onPress={() => pickMonth(i)}
                                    >
                                        <Text
                                            className={`text-xs font-extrabold ${i === month ? 'text-white' : 'text-ink'
                                                }`}
                                        >
                                            {m.slice(0, 3).toUpperCase()}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ) : null}

                        {step === 'day' ? (
                            <ScrollView className="max-h-[300px]" showsVerticalScrollIndicator={false}>
                                <View className="flex-row flex-wrap">
                                    {days.map(d => (
                                        <TouchableOpacity
                                            key={d}
                                            className="mb-3 mr-[2%] w-[12%] items-center rounded-xl border border-line bg-surface py-2.5"
                                            onPress={() => pickDay(d)}
                                        >
                                            <Text className="text-xs font-extrabold text-ink">
                                                {d}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </ScrollView>
                        ) : null}
                    </Animated.View>
                </View>
        </CenteredModal>
    );
}