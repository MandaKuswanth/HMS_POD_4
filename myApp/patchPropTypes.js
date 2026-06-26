const fs = require('fs');
const path = require('path');
const patches = [
  {file: 'src/components/AppAvatar.js', component: 'AppAvatar', propTypes: {name: 'PropTypes.string', size: 'PropTypes.number', backgroundColor: 'PropTypes.string', textColor: 'PropTypes.string'}},
  {file: 'src/components/AppButton.js', component: 'AppButton', propTypes: {title: 'PropTypes.string', onPress: 'PropTypes.func', disabled: 'PropTypes.bool', loading: 'PropTypes.bool', color: 'PropTypes.string', textColor: 'PropTypes.string', style: 'PropTypes.oneOfType([PropTypes.object, PropTypes.array])'}},
  {file: 'src/components/AppCard.js', component: 'AppCard', propTypes: {children: 'PropTypes.node', style: 'PropTypes.oneOfType([PropTypes.object, PropTypes.array])'}},
  {file: 'src/components/AppContainer.js', component: 'AppContainer', propTypes: {children: 'PropTypes.node', style: 'PropTypes.oneOfType([PropTypes.object, PropTypes.array])'}},
  {file: 'src/components/AppInput.js', component: 'AppInput', propTypes: {value: 'PropTypes.oneOfType([PropTypes.string, PropTypes.number])', onChangeText: 'PropTypes.func', placeholder: 'PropTypes.string', secureTextEntry: 'PropTypes.bool', keyboardType: 'PropTypes.string', autoCapitalize: 'PropTypes.string', multiline: 'PropTypes.bool', numberOfLines: 'PropTypes.number', style: 'PropTypes.oneOfType([PropTypes.object, PropTypes.array])', error: 'PropTypes.string'}},
  {file: 'src/components/forms/AddressForm.js', component: 'AddressForm', propTypes: {street: 'PropTypes.string', city: 'PropTypes.string', stateName: 'PropTypes.string', pincode: 'PropTypes.string', onStreetChange: 'PropTypes.func', onCityChange: 'PropTypes.func', onStateChange: 'PropTypes.func', onPincodeChange: 'PropTypes.func', pincodeError: 'PropTypes.string'}},
  {file: 'src/components/forms/ChipSelector.js', component: 'ChipSelector', propTypes: {label: 'PropTypes.string', options: 'PropTypes.array', value: 'PropTypes.any', onChange: 'PropTypes.func', error: 'PropTypes.string', required: 'PropTypes.bool', formatLabel: 'PropTypes.func'}},
  {file: 'src/components/forms/DatePickerField.js', component: 'DatePickerField', propTypes: {label: 'PropTypes.string', value: 'PropTypes.any', onChange: 'PropTypes.func', error: 'PropTypes.string', required: 'PropTypes.bool', maximumDate: 'PropTypes.oneOfType([PropTypes.instanceOf(Date), PropTypes.string, PropTypes.object])'}},
  {file: 'src/components/forms/EmergencyContactForm.js', component: 'EmergencyContactForm', propTypes: {name: 'PropTypes.string', relation: 'PropTypes.string', phone: 'PropTypes.string', onNameChange: 'PropTypes.func', onRelationChange: 'PropTypes.func', onPhoneChange: 'PropTypes.func', phoneError: 'PropTypes.string'}},
  {file: 'src/components/MedicalRecordCard.js', component: 'MedicalRecordCard', propTypes: {doctorName: 'PropTypes.string', specialization: 'PropTypes.string', diagnosis: 'PropTypes.string', symptoms: 'PropTypes.string', prescription: 'PropTypes.string', appointmentDate: 'PropTypes.string'}},
  {file: 'src/components/ScreenHeader.js', component: 'ScreenHeader', propTypes: {title: 'PropTypes.string', subtitle: 'PropTypes.string', goBack: 'PropTypes.func', right: 'PropTypes.node'}},
  {file: 'src/components/SectionLabel.js', component: 'SectionLabel', propTypes: {text: 'PropTypes.string'}},
  {file: 'src/context/AuthContext.js', component: 'AuthProvider', propTypes: {children: 'PropTypes.node.isRequired'}},
  {file: 'src/screens/auth/ForceResetPasswordScreen.js', component: 'ForceResetPasswordScreen', propTypes: {navigation: 'PropTypes.object.isRequired', route: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/auth/ForgotPasswordScreen.js', component: 'ForgotPasswordScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/auth/LoginScreen.js', component: 'LoginScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/auth/OTPVerificationScreen.js', component: 'OTPVerificationScreen', propTypes: {navigation: 'PropTypes.object.isRequired', route: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/auth/RegisterScreen.js', component: 'RegisterScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/auth/ResetPasswordScreen.js', component: 'ResetPasswordScreen', propTypes: {navigation: 'PropTypes.object.isRequired', route: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/patient/EditProfileScreen.js', component: 'EditProfileScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/patient/HealthRecordsScreen.js', component: 'HealthRecordsScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/patient/MyAppointmentsScreen.js', component: 'MyAppointmentsScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}},
  {file: 'src/screens/patient/ProfileScreen.js', component: 'ProfileScreen', propTypes: {navigation: 'PropTypes.object.isRequired'}}
];
for (const item of patches) {
  const filePath = path.join(process.cwd(), item.file);
  let txt = fs.readFileSync(filePath, 'utf8');
  if (!/import\s+PropTypes\s+from\s+["']prop-types["']/.test(txt)) {
    const lines = txt.split(/\r?\n/);
    let importIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('import ')) {
        importIndex = i;
      }
    }
    lines.splice(importIndex + 1, 0, 'import PropTypes from "prop-types";');
    txt = lines.join('\n');
  }
  if (!new RegExp(item.component + '\\s*\\.propTypes').test(txt)) {
    const propLines = Object.entries(item.propTypes).map(([k,v]) => '    ' + k + ': ' + v + ',').join('\n');
    txt = txt.trimEnd() + '\n\n' + item.component + '.propTypes = {\n' + propLines + '\n};\n';
  }
  fs.writeFileSync(filePath, txt, 'utf8');
}
const validatorPath = path.join(process.cwd(), 'src/utils/validators.js');
let vt = fs.readFileSync(validatorPath, 'utf8');
if (!/const FIELD_LABEL/.test(vt)) {
  vt = 'const FIELD_LABEL = "Password";\nconst PASSWORD_REQUIRED = FIELD_LABEL + " is required";\nconst PASSWORD_MIN_LENGTH = FIELD_LABEL + " must be at least 8 characters";\n\n' + vt;
}
vt = vt.replace(/errors\.password = \"Password is required\";/g, 'errors.password = PASSWORD_REQUIRED;');
vt = vt.replace(/errors\.password = \"Password must be at least 8 characters\";/g, 'errors.password = PASSWORD_MIN_LENGTH;');
fs.writeFileSync(validatorPath, vt, 'utf8');
console.log('patched');