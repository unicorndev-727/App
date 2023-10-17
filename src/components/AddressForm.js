import {CONST as COMMON_CONST} from 'expensify-common/lib/CONST';
import lodashGet from 'lodash/get';
import PropTypes from 'prop-types';
import React, {useCallback} from 'react';
import {View} from 'react-native';
import _ from 'underscore';
import useLocalize from '@hooks/useLocalize';
import Navigation from '@libs/Navigation/Navigation';
import * as ValidationUtils from '@libs/ValidationUtils';
import styles from '@styles/styles';
import CONST from '@src/CONST';
import AddressSearch from './AddressSearch';
import CountrySelector from './CountrySelector';
import Form from './Form';
import StatePicker from './StatePicker';
import TextInput from './TextInput';

const propTypes = {
    city: PropTypes.string,
    country: PropTypes.string,
    formID: PropTypes.string.isRequired,
    onAddressChanged: PropTypes.func,
    onSubmit: PropTypes.func.isRequired,
    state: PropTypes.string,
    street1: PropTypes.string,
    street2: PropTypes.string,
    submitButtonText: PropTypes.string,
    zip: PropTypes.string,
};

const defaultProps = {
    city: '',
    country: '',
    onAddressChanged: () => {},
    state: '',
    street1: '',
    street2: '',
    submitButtonText: '',
    zip: '',
};

function AddressForm({city, country, formID, onAddressChanged, onSubmit, state, street1, street2, submitButtonText, zip}) {
    const {translate} = useLocalize();
    const zipSampleFormat = lodashGet(CONST.COUNTRY_ZIP_REGEX_DATA, [country, 'samples'], '');
    const zipFormat = translate('common.zipCodeExampleFormat', {zipSampleFormat});
    const isUSAForm = country === CONST.COUNTRY.US;

    /**
     * @param {Function} translate - translate function
     * @param {Boolean} isUSAForm - selected country ISO code is US
     * @param {Object} values - form input values
     * @returns {Object} - An object containing the errors for each inputID
     */
    const validator = useCallback((values) => {
        const errors = {};
        const requiredFields = ['addressLine1', 'city', 'country', 'state'];

        // Check "State" dropdown is a valid state if selected Country is USA
        if (values.country === CONST.COUNTRY.US && !COMMON_CONST.STATES[values.state]) {
            errors.state = 'common.error.fieldRequired';
        }

        // Add "Field required" errors if any required field is empty
        _.each(requiredFields, (fieldKey) => {
            if (ValidationUtils.isRequiredFulfilled(values[fieldKey])) {
                return;
            }
            errors[fieldKey] = 'common.error.fieldRequired';
        });

        // If no country is selected, default value is an empty string and there's no related regex data so we default to an empty object
        const countryRegexDetails = lodashGet(CONST.COUNTRY_ZIP_REGEX_DATA, values.country, {});

        // The postal code system might not exist for a country, so no regex either for them.
        const countrySpecificZipRegex = lodashGet(countryRegexDetails, 'regex');
        const countryZipFormat = lodashGet(countryRegexDetails, 'samples');

        if (countrySpecificZipRegex) {
            if (!countrySpecificZipRegex.test(values.zipPostCode.trim().toUpperCase())) {
                if (ValidationUtils.isRequiredFulfilled(values.zipPostCode.trim())) {
                    errors.zipPostCode = ['privatePersonalDetails.error.incorrectZipFormat', {zipFormat: countryZipFormat}];
                } else {
                    errors.zipPostCode = 'common.error.fieldRequired';
                }
            }
        } else if (!CONST.GENERIC_ZIP_CODE_REGEX.test(values.zipPostCode.trim().toUpperCase())) {
            errors.zipPostCode = 'privatePersonalDetails.error.incorrectZipFormat';
        }

        return errors;
    }, []);

    return (
        <Form
            style={[styles.flexGrow1, styles.mh5, styles.mt5]}
            formID={formID}
            validate={validator}
            onSubmit={onSubmit}
            submitButtonText={submitButtonText}
            enabledWhenOffline
        >
            <View style={styles.formSpaceVertical} />
            <View>
                <AddressSearch
                    inputID="addressLine1"
                    label={translate('common.addressLine', {lineNumber: 1})}
                    onValueChange={() => {
                        onAddressChanged();
                        // This enforces the country selector to use the country from address instead of the previous selected country
                        Navigation.setParams({country: undefined});
                    }}
                    defaultValue={street1 || ''}
                    renamedInputKeys={{
                        street: 'addressLine1',
                        street2: 'addressLine2',
                        city: 'city',
                        state: 'state',
                        zipCode: 'zipPostCode',
                        country: 'country',
                    }}
                    maxInputLength={CONST.FORM_CHARACTER_LIMIT}
                />
            </View>
            <View style={styles.formSpaceVertical} />
            <TextInput
                inputID="addressLine2"
                label={translate('common.addressLine', {lineNumber: 2})}
                accessibilityLabel={translate('common.addressLine')}
                aria-label={translate('common.addressLine', {lineNumber: 2})}
                role={CONST.ACCESSIBILITY_ROLE.TEXT}
                defaultValue={street2 || ''}
                maxLength={CONST.FORM_CHARACTER_LIMIT}
                spellCheck={false}
            />
            <View style={styles.formSpaceVertical} />
            <View style={styles.mhn5}>
                <CountrySelector
                    inputID="country"
                    value={country}
                />
            </View>
            <View style={styles.formSpaceVertical} />
            {isUSAForm ? (
                <View style={styles.mhn5}>
                    <StatePicker
                        inputID="state"
                        defaultValue={state}
                        onValueChange={onAddressChanged}
                    />
                </View>
            ) : (
                <TextInput
                    inputID="state"
                    label={translate('common.stateOrProvince')}
                    accessibilityLabel={translate('common.stateOrProvince')}
                    aria-label={translate('common.stateOrProvince')}
                    role={CONST.ACCESSIBILITY_ROLE.TEXT}
                    value={state || ''}
                    maxLength={CONST.FORM_CHARACTER_LIMIT}
                    spellCheck={false}
                    onValueChange={onAddressChanged}
                />
            )}
            <View style={styles.formSpaceVertical} />
            <TextInput
                inputID="city"
                label={translate('common.city')}
                accessibilityLabel={translate('common.city')}
                aria-label={translate('common.city')}
                role={CONST.ACCESSIBILITY_ROLE.TEXT}
                value={city || ''}
                maxLength={CONST.FORM_CHARACTER_LIMIT}
                spellCheck={false}
                onValueChange={onAddressChanged}
            />
            <View style={styles.formSpaceVertical} />
            <TextInput
                inputID="zipPostCode"
                label={translate('common.zipPostCode')}
                accessibilityLabel={translate('common.zipPostCode')}
                aria-label={translate('common.zipPostCode')}
                role={CONST.ACCESSIBILITY_ROLE.TEXT}
                autoCapitalize="characters"
                value={zip || ''}
                maxLength={CONST.BANK_ACCOUNT.MAX_LENGTH.ZIP_CODE}
                hint={zipFormat}
                onValueChange={onAddressChanged}
            />
        </Form>
    );
}

AddressForm.defaultProps = defaultProps;
AddressForm.displayName = 'AddressForm';
AddressForm.propTypes = propTypes;

export default AddressForm;
