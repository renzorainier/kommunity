import React from 'react';
import { RxEnter } from "react-icons/rx";
import { RxExit } from "react-icons/rx";
function Attendance({ userData }) {
  console.log(userData);
  return (
    <main className="flex min-h-screen flex-col items-center justify-center pt-12">
      {userData && (
        <div className="w-full max-w-4xl bg-white text-gray-800 shadow-lg rounded-lg pt-2 overflow-hidden">
          <div className="bg-gradient-to-r from-[#035172] to-[#0587be] px-6 py-4">
            <div className="text-white font-bold text-3xl text-center">{userData.name}'s Attendance</div>
          </div>
          <div className="px-6 py-4">
            {Object.keys(userData.attendance).length > 0 ? (
              <div>
                <div className="grid grid-cols-4 gap-4  mb-4 bg-gray-200 p-4 rounded-lg">
                  <div className="font-semibold text-lg text-center">Day</div>
                  <div className="font-semibold text-lg text-center">Date</div>
                  <div className="font-semibold text-lg text-center">Log-in</div>
                  <div className="font-semibold text-lg items-center text-center"><RxExit style={{ fontSize: "1.5em" }}/></div>
                </div>
                <div className="grid gap-4">
                  {Object.keys(userData.attendance)
                    .sort((a, b) => new Date(b) - new Date(a)) // Sort keys in descending order
                    .map((date) => (
                      <div key={date} className="grid grid-cols-4 bg-gray-100 rounded-lg shadow-md p-4 hover:bg-gray-200 transition duration-300">
                        <div className="font-semibold text-lg text-center">{new Date(date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                        <div className="font-semibold text-lg text-center">{new Date(date).toLocaleDateString()}</div>
                        <div className="text-sm text-center">
                          {userData.attendance[date].checkIn
                            ? new Date(userData.attendance[date].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </div>
                        <div className="text-sm text-center">
                          {userData.attendance[date].checkOut
                            ? new Date(userData.attendance[date].checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : 'N/A'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <p className="text-center mt-4 text-gray-600">No attendance records found.</p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default Attendance;
