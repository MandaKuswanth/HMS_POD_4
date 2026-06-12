export const getTomorrowDate=()=>{const d=new Date();d.setDate(d.getDate()+1);d.setHours(0,0,0,0);return d;};
export const normalizeDateOnly=(date)=>{const d=new Date(date);d.setHours(0,0,0,0);return d;};
export const formatDateForApi=(date)=>{if(!date)return"";const d=new Date(date);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
export const formatDateDisplay=(date)=>{if(!date)return"—";const d=new Date(date);return Number.isNaN(d.getTime())?"—":d.toDateString();};
