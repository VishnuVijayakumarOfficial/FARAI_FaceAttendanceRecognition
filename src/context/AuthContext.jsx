import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const storedUser = localStorage.getItem('custom_auth_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setRole(parsed.role);
        } catch (e) {
          localStorage.removeItem('custom_auth_user');
        }
      }
      setLoading(false);
    };

    getSession();
  }, []);

  const fetchUserRole = async (userId) => {
    // Check if user is admin
    const { data: adminData } = await supabase
      .from('admins')
      .select('id')
      .eq('id', userId)
      .single();

    if (adminData) {
      setRole('admin');
      return;
    }

    // Check if user is employee
    const { data: employeeData } = await supabase
      .from('employees')
      .select('id')
      .eq('id', userId)
      .single();

    if (employeeData) {
      setRole('employee');
    }
  };

  const signOut = async () => {
    localStorage.removeItem('custom_auth_user');
    setUser(null);
    setRole(null);
  };

  const signInAsDemo = (userRole) => {
    setUser({ 
      id: 'demo-user-id', 
      email: userRole === 'admin' ? 'admin@demo.com' : 'employee@demo.com',
      user_metadata: { full_name: 'Demo User' }
    });
    setRole(userRole);
  };

  const signInManually = async (email, password, expectedRole) => {
    if (expectedRole === 'admin') {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (data) {
        const userData = { id: data.id, email: data.email, user_metadata: { full_name: data.name }, role: 'admin' };
        setUser(userData);
        setRole('admin');
        localStorage.setItem('custom_auth_user', JSON.stringify(userData));
        return data;
      } else {
        throw new Error('Invalid login credentials');
      }
    } else {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
      
      if (data) {
        const userData = { id: data.id, email: data.email, user_metadata: { full_name: data.name }, role: 'employee' };
        setUser(userData);
        setRole('employee');
        localStorage.setItem('custom_auth_user', JSON.stringify(userData));
        return data;
      } else {
        throw new Error('Invalid login credentials');
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signOut, signInAsDemo, signInManually }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
