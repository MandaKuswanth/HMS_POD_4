import React from "react";

import AppInput from "../AppInput";
import SectionLabel from "../SectionLabel";
import PropTypes from "prop-types";

export default function EmergencyContactForm({
    name,
    relation,
    phone,
    onNameChange,
    onRelationChange,
    onPhoneChange,
    phoneError,
}) {
    return (
        <>
            <SectionLabel text="Emergency Contact" />

            <AppInput
                placeholder="Contact Name"
                value={name}
                onChangeText={onNameChange}
            />

            <AppInput
                placeholder="Relation"
                value={relation}
                onChangeText={onRelationChange}
            />

            <AppInput
                placeholder="Contact Phone"
                value={phone}
                onChangeText={onPhoneChange}
                keyboardType="phone-pad"
                error={phoneError}
            />
        </>
    );
}

EmergencyContactForm.propTypes = {
    name: PropTypes.string,
    relation: PropTypes.string,
    phone: PropTypes.string,
    onNameChange: PropTypes.func,
    onRelationChange: PropTypes.func,
    onPhoneChange: PropTypes.func,
    phoneError: PropTypes.string,
};
