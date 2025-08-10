import React, { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import pl from 'date-fns/locale/pl';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppData } from '../AppContext';

const locales = { 'pl': pl };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// --- ZMIANA: Komponent teraz akceptuje nowe propsy ---
export default function TasksCalendarView({ onDayClick, date, onNavigate }) {
  const { calendarTasks } = useAppData();

  const events = useMemo(() => {
    console.log('TasksCalendarView - calendarTasks:', calendarTasks);
    return calendarTasks.map(task => {
      console.log('Processing task:', task);
      return {
        id: task.id,
        title: task.title,
        start: new Date(task.publication_date),
        end: new Date(task.publication_date),
        allDay: true,
        resource: task,
      };
    });
  }, [calendarTasks]);

  const eventStyleGetter = (event) => {
    const importance = event.resource.importance;
    let backgroundColor = '#3174ad';
    if (importance === 'niska') backgroundColor = '#5cb85c';
    if (importance === 'wysoka') backgroundColor = '#d9534f';
    return { style: { backgroundColor } };
  };

  return (
    <div className="card" style={{ height: '75vh' }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        culture="pl"
        messages={{
            next: "Następny",
            previous: "Poprzedni",
            today: "Dziś",
            month: "Miesiąc",
            week: "Tydzień",
            day: "Dzień",
            agenda: "Agenda",
            date: "Data",
            time: "Godzina",
            event: "Zadanie",
        }}
        onSelectSlot={(slotInfo) => onDayClick(slotInfo.start)}
        onSelectEvent={(event) => onDayClick(event.start)}
        selectable={true}
        eventPropGetter={eventStyleGetter}
        // --- NOWOŚĆ: Kontrolujemy datę i nawigację ---
        date={date}
        onNavigate={onNavigate}
      />
    </div>
  );
}