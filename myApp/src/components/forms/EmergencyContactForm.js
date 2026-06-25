import React from "react";

import AppInput from "../AppInput";
import SectionLabel from "../SectionLabel";

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