import { useMemo, useState } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { useRouter } from 'next/navigation';
import { formatMonthValue, parseMonthValue } from '@/lib/month';
import { buildMonthsForYear } from '../utils/monthPicker';

export function useMonthNavigation(
  selectedMonth?: string,
  serverMonth?: string,
) {
  const { year, month: monthNumber } = parseMonthValue(selectedMonth);
  const selectedValue = formatMonthValue(year, monthNumber);
  const month = serverMonth
    ?? new Date(year, monthNumber - 1, 1).toLocaleString('default', {
      month: 'long',
    });

  const now = new Date();
  const currentValue = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [pickerOpened, { close: closePicker, toggle: togglePicker }] = useDisclosure(false);
  const [pickerYear, setPickerYear] = useState<number>(year);
  const [navDir, setNavDir] = useState<1 | -1>(1);
  const handlePickerToggle = () => {
    if (!pickerOpened) setPickerYear(year);
    togglePicker();
  };
  const pickerMonths = useMemo(
    () => buildMonthsForYear(pickerYear),
    [pickerYear],
  );

  const router = useRouter();

  const goToMonth = (value: string) => {
    setNavDir(value > selectedValue ? 1 : -1);
    router.push(`/planning?month=${value}`);
  };

  return {
    year,
    selectedValue,
    currentValue,
    month,
    pickerOpened,
    closePicker,
    togglePicker,
    pickerYear,
    setPickerYear,
    navDir,
    handlePickerToggle,
    pickerMonths,
    goToMonth,
  };
}
