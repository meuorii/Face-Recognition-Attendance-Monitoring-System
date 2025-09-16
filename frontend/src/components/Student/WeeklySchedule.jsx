import React, { useEffect, useState } from "react";
import axios from "axios";

const WeeklySchedule = () => {
  const [scheduleData, setScheduleData] = useState({});
  const [loading, setLoading] = useState(true);

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const timeSlots = [
    "07:30", "08:00", "08:30", "09:00", "09:30",
    "10:00", "10:30", "11:00", "11:30",
    "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00",
  ];

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("userData"));
        const token = localStorage.getItem("token");

        const res = await axios.get(
          `http://localhost:5000/api/student/schedule/${user.student_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setScheduleData(res.data || {});
        setLoading(false);
      } catch (err) {
        console.error("Failed to load schedule", err);
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const parseHourDecimal = (timeStr) => {
    if (!timeStr || typeof timeStr !== "string") return 0;
    const [h, m] = timeStr.trim().split(":").map(Number);
    return h + m / 60;
  };

  const renderedKeys = new Set();

  const getSubjectBlock = (day, slotTime) => {
    const slotDecimal = parseHourDecimal(slotTime);
    const blocks = scheduleData[day] || [];

    for (const block of blocks) {
      const startDec = parseHourDecimal(block.start);
      const endDec = parseHourDecimal(block.end);

      // First cell of the subject block
      if (Math.abs(startDec - slotDecimal) < 0.001) {
        const key = `${day}-${slotTime}`;
        if (!renderedKeys.has(key)) {
          renderedKeys.add(key);
          const span = Math.round((endDec - startDec) / 0.5);
          return { ...block, rowSpan: span };
        }
      }

      // Skip intermediate cells
      if (slotDecimal > startDec && slotDecimal < endDec) {
        return "skip";
      }
    }

    return null;
  };

  if (loading) {
    return <div className="text-center text-gray-300 p-4">Loading schedule...</div>;
  }

  return (
    <div className="w-full px-2 sm:px-4">
      <div className="grid grid-cols-6 auto-rows-[40px] w-full border border-green-600 text-[12px] sm:text-sm overflow-hidden">
        {/* Header Row */}
        <div className="bg-green-600 text-white font-bold text-center p-2 border-r border-green-600">
          Time
        </div>
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="bg-green-600 text-white font-bold text-center p-2 border-r border-green-600"
          >
            {day}
          </div>
        ))}

        {/* Time Rows */}
        {timeSlots.map((slot, rowIndex) => (
          <div key={rowIndex} className="contents">
            {/* Time column */}
            <div className="bg-neutral-800 text-green-400 font-medium flex items-center justify-center border-t border-green-700">
              {slot}
            </div>

            {daysOfWeek.map((day) => {
              const block = getSubjectBlock(day, slot);

              if (block === "skip") return null;

              if (block) {
                return (
                  <div
                    key={`${day}-${slot}`}
                    className="bg-green-700 text-white p-1 sm:p-2 rounded shadow text-[11px] sm:text-xs border border-green-900 overflow-hidden break-words flex flex-col justify-center"
                    style={{ gridRow: `span ${block.rowSpan}`, minWidth: "0" }}
                  >
                    <div className="font-semibold truncate text-[11px] sm:text-sm">
                      {block.subject_code}
                    </div>
                    <div className="whitespace-normal break-words">{block.subject_title}</div>
                    <div className="text-[10px]">{block.start} - {block.end}</div>
                    <div className="text-[10px] italic">
                      {block.course} - {block.section}
                    </div>
                    <div className="text-[10px]">
                      {block.instructor_first_name} {block.instructor_last_name}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={`${day}-${slot}-empty`}
                  className="border-t border-green-800"
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklySchedule;
