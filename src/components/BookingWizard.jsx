"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle2, Calendar as CalendarIcon, Clock, MapPin, User, Mail, Briefcase, Heart } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameDay, isSameMonth, isBefore, startOfDay } from 'date-fns';

export default function BookingWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [locations, setLocations] = useState([]);
  const [availableDays, setAvailableDays] = useState([]);
  const [expertSlots, setExpertSlots] = useState([]);
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_email: '',
    department: '',
    location_code: '',
    feeling: '',
    booking_date: null,
    booking_time: null,
    expert_id: null,
    expert_name: ''
  });

  // Autofill user details from session storage
  useEffect(() => {
    const name = sessionStorage.getItem("user_name");
    const email = sessionStorage.getItem("user_email");
    const dept = sessionStorage.getItem("user_department");
    
    if (name || email || dept) {
      setFormData(prev => ({
        ...prev,
        employee_name: name || prev.employee_name,
        employee_email: email || prev.employee_email,
        department: dept || prev.department
      }));
    }
  }, []);

  useEffect(() => {
    const userId = sessionStorage.getItem('user_id');
    fetch(`/mbrdi-onsite-session/api/locations`)
      .then(res => res.json())
      .then(data => {
        if (data.locations) setLocations(data.locations);
      })
      .catch(err => console.error("Failed to fetch locations", err));
  }, []);

  const handleNext = async () => {
    if (step === 1) {
      const errors = {};
      
      if (!formData.employee_name) errors.employee_name = true;
      if (!formData.department) errors.department = true;
      if (!formData.location_code) errors.location_code = true;
      
      // Email validation: must contain @ and ., and no special characters other than + @ .
      const email = formData.employee_email;
      const hasRequiredChars = email.includes('@') && email.includes('.');
      const hasInvalidChars = /[^a-zA-Z0-9+@.]/.test(email);
      
      if (!email || !hasRequiredChars || hasInvalidChars) {
        errors.employee_email = true;
      }
      
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        setError("Please check the highlighted fields and ensure your email is formatted correctly.");
        return;
      }
      
      setFieldErrors({});
      setError(null);
      setLoading(true);

      // Fetch available days for the location
      const userId = sessionStorage.getItem('user_id');
      try {
        const res = await fetch(`/mbrdi-onsite-session/api/location-days?locationCode=${formData.location_code}`);
        const data = await res.json();
        if (data.availableDays) {
          setAvailableDays(data.availableDays);
        }
      } catch (err) {
        console.error("Failed to fetch available days", err);
      } finally {
        setLoading(false);
        setStep(2);
      }
    } else if (step === 2) {
      if (!formData.booking_date) {
        setError("Please select a date.");
        return;
      }
      setError(null);
      setLoading(true);
      
      const userId = sessionStorage.getItem('user_id');
      const dateStr = format(formData.booking_date, 'yyyy-MM-dd');
      const dayOfWeek = format(formData.booking_date, 'EEEE');
      
      try {
        const res = await fetch(`/mbrdi-onsite-session/api/available-slots?locationCode=${formData.location_code}&date=${dateStr}&day=${dayOfWeek}&user_id=${userId}`);
        const data = await res.json();
        if (data.expertSlots) {
          setExpertSlots(data.expertSlots);
          setStep(3);
        } else {
          setError(data.error || "Failed to fetch slots");
        }
      } catch (err) {
        setError("Network error fetching slots.");
      } finally {
        setLoading(false);
      }
    } else if (step === 3) {
      if (!formData.booking_time || !formData.expert_id) {
        setError("Please select a time slot.");
        return;
      }
      setError(null);
      setLoading(true);
      
      const userId = sessionStorage.getItem('user_id');
      const payload = {
        ...formData,
        booking_date: format(formData.booking_date, 'yyyy-MM-dd'),
        user_id: userId
      };

      try {
        const res = await fetch('/mbrdi-onsite-session/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setStep(4);
        } else {
          setError(data.error || "Failed to book session");
        }
      } catch (err) {
        setError("Network error creating booking.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    setError(null);
    setFieldErrors({});
    setStep(prev => prev - 1);
  };

  const slideVariants = {
    initial: { opacity: 0, x: 20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 }
  };

  // Calendar render function
  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const today = startOfDay(new Date());

    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, 'd');
        const cloneDay = day;
        const isPastDate = isBefore(day, today);
        const isCurrentMonth = isSameMonth(day, monthStart);
        const isSelected = formData.booking_date && isSameDay(day, formData.booking_date);
        const dayOfWeekName = format(day, 'EEEE');
        const isAvailableDay = availableDays.length > 0 && availableDays.includes(dayOfWeekName);
        
        let buttonClass = "w-full py-3 rounded-2xl border-2 transition-all font-semibold flex items-center justify-center ";
        if (!isCurrentMonth) {
          buttonClass += "opacity-0 pointer-events-none"; // Hide days outside current month
        } else if (isPastDate || !isAvailableDay) {
          buttonClass += "bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed";
        } else if (isSelected) {
          buttonClass += "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700";
        } else {
          buttonClass += "border-gray-100 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50";
        }

        days.push(
          <button
            key={day.toString()}
            disabled={!isCurrentMonth || isPastDate || !isAvailableDay}
            onClick={() => setFormData({...formData, booking_date: cloneDay})}
            className={buttonClass}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-2 mb-2" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 overflow-hidden">
      
      {/* Progress Header */}
      <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full z-0"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
          
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm transition-colors duration-300 ${step >= s ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-white text-gray-400 border-2 border-gray-200'}`}>
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="initial"
            animate="in"
            exit="out"
            transition={{ duration: 0.3 }}
            className="min-h-[400px]"
          >
            {/* STEP 1: Details */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
                  <p className="text-gray-500">Please provide your details to begin booking a session.</p>
                </div>
                
                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

                <div className="space-y-4">
                  <div className="relative">
                    <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.employee_name ? 'text-red-400' : 'text-gray-400'}`} />
                    <input type="text" placeholder="Employee Name *" className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${fieldErrors.employee_name ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`} value={formData.employee_name} onChange={e => { setFormData({...formData, employee_name: e.target.value}); setFieldErrors({...fieldErrors, employee_name: false}); }} />
                  </div>
                  
                  <div className="relative">
                    <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.employee_email ? 'text-red-400' : 'text-gray-400'}`} />
                    <input type="email" placeholder="Employee Email *" className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${fieldErrors.employee_email ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`} value={formData.employee_email} onChange={e => { setFormData({...formData, employee_email: e.target.value}); setFieldErrors({...fieldErrors, employee_email: false}); }} />
                  </div>

                  <div className="relative">
                    <Briefcase className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.department ? 'text-red-400' : 'text-gray-400'}`} />
                    <input type="text" placeholder="Department *" className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all ${fieldErrors.department ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/30' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`} value={formData.department} onChange={e => { setFormData({...formData, department: e.target.value}); setFieldErrors({...fieldErrors, department: false}); }} />
                  </div>

                  <div className="relative">
                    <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${fieldErrors.location_code ? 'text-red-400' : 'text-gray-400'}`} />
                    <select className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:ring-2 outline-none transition-all appearance-none ${fieldErrors.location_code ? 'border-red-500 focus:border-red-500 focus:ring-red-200 bg-red-50/30' : 'bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-200'}`} value={formData.location_code} onChange={e => { setFormData({...formData, location_code: e.target.value}); setFieldErrors({...fieldErrors, location_code: false}); }}>
                      <option value="" disabled>Select Location *</option>
                      {locations.map(loc => (
                        <option key={loc.location_code} value={loc.location_code}>{loc.location_code} - {loc.location_city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative">
                    <Heart className="absolute left-3 top-4 w-5 h-5 text-gray-400" />
                    <textarea placeholder="How are you feeling? (Optional)" rows="3" className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all resize-none" value={formData.feeling} onChange={e => setFormData({...formData, feeling: e.target.value})}></textarea>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Date Selection (Month Calendar) */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Select a Date</h2>
                    <p className="text-gray-500">Choose a day that works best for you.</p>
                  </div>
                  
                  {/* Month Toggles */}
                  <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} 
                      disabled={isBefore(endOfMonth(subMonths(currentMonth, 1)), startOfDay(new Date()))}
                      className="p-1 rounded-lg hover:bg-white hover:shadow-sm transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:shadow-none"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="font-semibold text-gray-800 w-28 text-center">{format(currentMonth, 'MMMM yyyy')}</span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} 
                      className="p-1 rounded-lg hover:bg-white hover:shadow-sm transition-all"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

                <div className="bg-white rounded-2xl">
                  {/* Days of Week Header */}
                  <div className="grid grid-cols-7 gap-2 mb-4 text-center">
                    {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(day => (
                      <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div>
                    {renderCalendar()}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Time Selection */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Available Slots</h2>
                  <p className="text-gray-500">Pick a time slot with an expert for {format(formData.booking_date, 'MMMM d, yyyy')}.</p>
                </div>

                {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>}

                {expertSlots.length === 0 ? (
                  <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                    <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No experts are available on this date. Please go back and try another day.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {expertSlots.map(expert => (
                      <div key={expert.expert_id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {expert.expert_name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{expert.expert_name}</h3>
                            <p className="text-xs text-gray-500">{expert.counselor_type}</p>
                          </div>
                        </div>
                        
                        {expert.available_slots.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {expert.available_slots.map(time => {
                              const isSelected = formData.booking_time === time && formData.expert_id === expert.expert_id;
                              return (
                                <button
                                  key={time}
                                  onClick={() => setFormData({...formData, booking_time: time, expert_id: expert.expert_id, expert_name: expert.expert_name})}
                                  className={`py-2 text-sm font-medium rounded-xl border transition-all ${isSelected ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}`}
                                >
                                  {time}
                                </button>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400 italic">No available slots left.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Confirmation */}
            {step === 4 && (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-6">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ type: "spring", bounce: 0.5 }}
                  className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2"
                >
                  <CheckCircle2 className="w-10 h-10" />
                </motion.div>
                
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">Booking Confirmed!</h2>
                  <p className="text-gray-500 max-w-md mx-auto">Your 60 min session with <span className="font-semibold text-gray-800">{formData.expert_name}</span> has been successfully scheduled.</p>
                </div>
                
                <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 w-full max-w-md mt-6 space-y-4 text-left">
                  <div className="flex items-center gap-3 text-gray-700">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    <span>{formData.booking_date ? format(formData.booking_date, 'MMMM d, yyyy') : ''}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span>{formData.booking_time}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <span>{formData.location_code}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        {step < 4 && (
          <div className="mt-8 flex items-center justify-between pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button 
                onClick={handleBack}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 text-gray-600 font-medium hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-all"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <div></div>
            )}
            
            <button
              onClick={handleNext}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-70 disabled:pointer-events-none"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : step === 3 ? (
                "Confirm Booking"
              ) : (
                <>Continue <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
