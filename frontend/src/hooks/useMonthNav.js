// 월 단위 이동(이전/다음/오늘) 상태와 핸들러를 제공하는 공통 훅
import { useState } from 'react';

export default function useMonthNav() {
  const [viewDate, setViewDate] = useState(new Date());

  const handlePrevMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  const handleNextMonth = () =>
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const resetToToday = () => setViewDate(new Date());

  return { viewDate, handlePrevMonth, handleNextMonth, resetToToday };
}
