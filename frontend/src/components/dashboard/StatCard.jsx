import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color = 'primary', link }) => {
  const colorMap = {
    primary: 'text-primary',
    error: 'text-error',
    secondary: 'text-secondary',
    maintext: 'text-maintext',
  };

  const CardContent = (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center items-center hover:shadow-md transition h-full">
      {icon && <div className="mb-2 text-2xl">{icon}</div>}
      <p className="text-sm text-subtext mb-1">{title}</p>
      <p className={`text-3xl font-bold ${colorMap[color]}`}>{value}</p>
    </div>
  );

  if (link) {
    return <Link to={link} className="block h-full">{CardContent}</Link>;
  }

  return CardContent;
};

export default StatCard;