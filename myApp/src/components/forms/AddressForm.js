import React from "react";

import AppInput from "../AppInput";
import SectionLabel from "../SectionLabel";
import PropTypes from "prop-types";

export default function AddressForm({
    street,
    city,
    stateName,
    pincode,
    onStreetChange,
    onCityChange,
    onStateChange,
    onPincodeChange,
    pincodeError,
}) {
    return (
        <>
            <SectionLabel text="Address" />

            <AppInput
                placeholder="Street Address"
                value={street}
                onChangeText={onStreetChange}
            />

            <AppInput
                placeholder="City"
                value={city}
                onChangeText={onCityChange}
            />

            <AppInput
                placeholder="State"
                value={stateName}
                onChangeText={onStateChange}
            />

            <AppInput
                placeholder="Pincode"
                value={pincode}
                onChangeText={onPincodeChange}
                keyboardType="numeric"
                error={pincodeError}
            />
        </>
    );
}

AddressForm.propTypes = {
    street: PropTypes.string,
    city: PropTypes.string,
    stateName: PropTypes.string,
    pincode: PropTypes.string,
    onStreetChange: PropTypes.func,
    onCityChange: PropTypes.func,
    onStateChange: PropTypes.func,
    onPincodeChange: PropTypes.func,
    pincodeError: PropTypes.string,
};
