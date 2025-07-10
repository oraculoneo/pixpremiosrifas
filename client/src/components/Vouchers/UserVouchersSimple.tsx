import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const UserVouchersSimple: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div className="card-modern-dark rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-gold mb-6">Comprovantes Enviados</h2>
        
        <div className="text-center text-gray-300">
          <p>Usuário: {user?.nome}</p>
          <p>ID: {user?.id}</p>
          <p>Componente UserVouchers funcionando!</p>
        </div>
      </div>
    </div>
  );
};

export default UserVouchersSimple;