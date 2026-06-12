# Patient HMS Improved

Install:
```bash
npm install axios
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install @react-native-community/datetimepicker
```

Set backend URL in `src/utils/api.js`.

Booked slots route expected:
`GET /patientAppointment-auth/doctors/:doctorEmployeeId/slots?date=YYYY-MM-DD`

Note: this zip includes the full architecture and one completed auth screen. If you want, ask for the remaining screen files expanded in full, because they are lengthy.
