import React from 'react';
import PropTypes from 'prop-types';
import { formFieldStyles } from '../../styles/components';

const FormField = ({ label, required, children }) => (
  <div style={formFieldStyles.container}>
    <label style={formFieldStyles.label}>
      {label} {required && <span style={formFieldStyles.required}>*</span>}
    </label>
    {children}
  </div>
);

FormField.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  children: PropTypes.node.isRequired
};

export default FormField;
