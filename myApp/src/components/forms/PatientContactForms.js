import React from "react";

import AppCard from "../AppCard";
import AddressForm from "./AddressForm";
import EmergencyContactForm from "./EmergencyContactForm";
import PropTypes from "prop-types";

const renderSection = (content, cardStyle) => {
    if (!cardStyle) {
        return content;
    }

    return (
        <AppCard style={cardStyle}>
            {content}
        </AppCard>
    );
};

export default function PatientContactForms({
    form,
    cardStyle,
}) {
    return (
        <>
            {renderSection(
                <AddressForm
                    street={form.street}
                    city={form.city}
                    stateName={form.stateName}
                    pincode={form.pincode}
                    onStreetChange={form.setStreet}
                    onCityChange={form.setCity}
                    onStateChange={form.setStateName}
                    onPincodeChange={form.handlePincodeChange}
                    pincodeError={form.errors.pincode}
                />,
                cardStyle
            )}

            {renderSection(
                <EmergencyContactForm
                    name={form.ecName}
                    relation={form.ecRelation}
                    phone={form.ecPhone}
                    onNameChange={form.setEcName}
                    onRelationChange={form.setEcRelation}
                    onPhoneChange={form.handleEmergencyPhoneChange}
                    phoneError={form.errors.emergencyPhone}
                />,
                cardStyle
            )}
        </>
    );
}

PatientContactForms.propTypes = {
    form: PropTypes.shape({
        street: PropTypes.string,
        city: PropTypes.string,
        stateName: PropTypes.string,
        pincode: PropTypes.string,
        ecName: PropTypes.string,
        ecRelation: PropTypes.string,
        ecPhone: PropTypes.string,
        errors: PropTypes.object.isRequired,
        setStreet: PropTypes.func.isRequired,
        setCity: PropTypes.func.isRequired,
        setStateName: PropTypes.func.isRequired,
        setEcName: PropTypes.func.isRequired,
        setEcRelation: PropTypes.func.isRequired,
        handlePincodeChange: PropTypes.func.isRequired,
        handleEmergencyPhoneChange: PropTypes.func.isRequired,
    }).isRequired,
    cardStyle: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
};
