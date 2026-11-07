import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-8">
          <img
            src="/logo.jpeg"
            alt="AgriHerd"
            className="w-36 h-auto mx-auto mb-4"
          />
          <p className="text-sm text-subtext mt-1">Manage Your Farm with Ease</p>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;