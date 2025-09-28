// src/components/Student/WeeklySchedule.jsx
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
          { headers: { Authorization: `Bearer ${token}` } }
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

      if (Math.abs(startDec - slotDecimal) < 0.001) {
        const key = `${day}-${slotTime}`;
        if (!renderedKeys.has(key)) {
          renderedKeys.add(key);
          const span = Math.round((endDec - startDec) / 0.5);
          return { ...block, rowSpan: span };
        }
      }

      if (slotDecimal > startDec && slotDecimal < endDec) {
        return "skip";
      }
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center text-gray-300 p-6 animate-pulse">
        Loading schedule...
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-8">
      {/* 🔹 Header Section */}
      <div className="text-left my-8 mb-1 mx-2">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold 
                       bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 
                       bg-clip-text text-transparent drop-shadow-lg">
          Weekly Schedule
        </h2>
        <p className="mt-1 text-sm sm:text-base text-gray-400">
          Stay on top of your classes with a clear daily overview
        </p>
      </div>

      <div className="p-6 sm:p-8">

        {/* ✅ Grid View for Tablet & Desktop */}
        <div
          className="
            hidden sm:grid
            auto-rows-[50px] sm:auto-rows-[60px] md:auto-rows-[70px]
            text-[11px] sm:text-sm md:text-base
            grid-cols-6
          "
        >
          {/* Header Row */}
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 
                          text-white font-bold text-center p-2 border-r border-green-700 shadow-md">
            Time
          </div>
          {daysOfWeek.map((day) => (
            <div
              key={day}
              className="bg-gradient-to-r from-emerald-500 to-green-600 
                         text-white font-bold text-center p-2 border-r border-green-700 shadow-md"
            >
              {day}
            </div>
          ))}

          {/* Time Rows */}
          {timeSlots.map((slot, rowIndex) => (
            <div key={rowIndex} className="contents">
              {/* Time column */}
              <div className="bg-neutral-900/80 text-emerald-400 font-medium 
                              flex items-center justify-center border-t border-green-700">
                {slot}
              </div>

              {daysOfWeek.map((day) => {
                const block = getSubjectBlock(day, slot);

                if (block === "skip") return null;

                if (block) {
                  return (
                    <div
                      key={`${day}-${slot}`}
                      className="relative bg-gradient-to-br from-emerald-600/40 to-green-700/40 
                                 rounded-lg border border-white/10 shadow-lg 
                                 p-2 overflow-hidden transition transform hover:scale-[1.02] 
                                 hover:shadow-emerald-500/30"
                      style={{ gridRow: `span ${block.rowSpan}`, minWidth: "0" }}
                    >
                      <div
                        className="relative z-10 flex flex-col items-center justify-center gap-1 text-center px-2 py-1
                                  transition-all duration-300 ease-in-out group"
                      >
                        {/* Subject Code */}
                        <div
                          className="font-bold text-white text-[10px] sm:text-xs md:text-sm tracking-wide drop-shadow-sm
                                    transition-colors duration-300 group-hover:text-emerald-300"
                        >
                          {block.subject_code}
                        </div>

                        {/* Schedule */}
                        <div
                          className="text-[9px] sm:text-[10px] md:text-xs font-medium text-emerald-200 tracking-tight
                                    transition-all duration-300 group-hover:text-emerald-400 group-hover:translate-y-[-2px]"
                        >
                          {block.start} – {block.end}
                        </div>

                        {/* Pulse Glow on Hover */}
                        <div
                          className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100
                                    bg-gradient-to-r from-emerald-500/30 to-green-600/30 blur-lg
                                    animate-pulse transition-opacity duration-500 pointer-events-none"
                        />
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`${day}-${slot}-empty`}
                    className="border-t border-green-900 bg-neutral-900/30"
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* ✅ Card View for Mobile */}
        <div className="sm:hidden flex flex-col gap-4">
          {daysOfWeek.map((day) => (
            <div key={day} className="bg-neutral-800 rounded-lg p-4 shadow-md">
              <h3 className="text-emerald-400 font-bold mb-3">{day}</h3>
              {scheduleData[day]?.length > 0 ? (
                scheduleData[day].map((block, idx) => (
                  <div
                    key={idx}
                    className="relative bg-gradient-to-r from-emerald-600/40 to-green-700/40 
                              p-3 rounded-lg mb-2 border border-white/10
                              transition-all duration-300 ease-in-out 
                              transform hover:scale-[1.02] group"
                  >
                    {/* Subject Code */}
                    <div
                      className="font-semibold text-white text-sm
                                transition-colors duration-300 group-hover:text-emerald-300"
                    >
                      {block.subject_code}
                    </div>

                    {/* Schedule */}
                    <div
                      className="text-emerald-200 text-xs
                                transition-colors duration-300 group-hover:text-emerald-400"
                    >
                      {block.start} – {block.end}
                    </div>

                    {/* Pulse Glow */}
                    <div
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100
                                bg-gradient-to-r from-emerald-500/20 to-green-600/20 blur-md
                                animate-pulse transition-opacity duration-500 pointer-events-none"
                    />
                  </div>
                ))
              ) : (
                <div className="text-gray-400 text-xs">No classes</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeeklySchedule;
