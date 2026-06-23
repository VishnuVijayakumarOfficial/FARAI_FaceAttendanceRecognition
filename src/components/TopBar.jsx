import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { Bell, Search, User, Sun, Moon } from 'lucide-react';
import styles from './TopBar.module.css';

const TopBar = ({ title }) => {
  const { user } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={styles.topbar}>
      <h1 className={styles.title}>{title || 'Dashboard'}</h1>

      <div className={styles.actions}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} size={18} />
          <input
            type="text"
            placeholder="Search anything..."
            className={styles.searchInput}
          />
        </div>

        <button onClick={toggleTheme} className={styles.iconBtn}>
          {isDarkMode ? <Sun size={20} className={styles.iconColor} /> : <Moon size={20} className={styles.iconColor} />}
        </button>

        <button className={styles.iconBtn}>
          <Bell size={20} className={styles.iconColor} />
          <span className={styles.badge}></span>
        </button>

        <div className={styles.profileSection}>
          <div className={styles.profileText}>
            <p className={styles.profileName}>{user?.email?.split('@')[0] || 'Admin'}</p>
            <p className={styles.profileRole}>Super Admin</p>
          </div>
          <div className={styles.profileIcon}>
            <User size={20} className={styles.iconColor} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
