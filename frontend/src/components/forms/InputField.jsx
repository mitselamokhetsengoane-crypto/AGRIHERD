const InputField = ({ label, type = 'text', name, value, onChange, placeholder, required = false, options = [] }) => {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-subtext mb-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white"
        >
          <option value="">Select {label}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          rows="3"
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
        />
      )}
    </div>
  );
};

export default InputField;