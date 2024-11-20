import { colors } from './colors';
// import background from '../assets/background1.svg';

export const homeStyles = {
  container: {
    minHeight: '100vh',
    width: '100%',
    // backgroundImage: `url(${background})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: { xs: 2, sm: 3, md: 4 }
  },
  menuContainer: {
    backgroundColor: 'rgba(13, 13, 13, 0.95)',
    border: `1px solid ${colors.primary.orange}`,
    borderRadius: '8px',
    padding: { xs: 2, sm: 3, md: 4 },
    width: '100%',
    maxWidth: { xs: '95%', sm: '600px', md: '800px' }
  },
  title: {
    color: colors.text.orange,
    textAlign: 'center',
    marginBottom: { xs: 2, sm: 3 },
    fontSize: { xs: '1.2rem', sm: '1.4rem', md: '1.6rem' }
  },
  subtitle: {
    color: colors.text.white,
    textAlign: 'center',
    marginBottom: { xs: 3, sm: 4 },
    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
    gap: { xs: 2, sm: 3 },
    width: '100%',
    justifyItems: 'center'
  },
  menuItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
    cursor: 'pointer',
    width: '100%',
    maxWidth: { xs: '120px', sm: '140px', md: '160px' },
    transition: 'transform 0.2s ease',
    '&:hover': {
      transform: 'scale(1.05)'
    }
  },
  iconContainer: {
    width: { xs: '60px', sm: '70px', md: '80px' },
    height: { xs: '60px', sm: '70px', md: '80px' },
    backgroundColor: colors.background.input,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
    border: `1px solid ${colors.border.gray}`
  },
  icon: {
    width: '60%',
    height: '60%',
    color: colors.text.black
  },
  menuText: {
    color: colors.text.white,
    textAlign: 'center',
    fontSize: { xs: '0.9rem', sm: '1rem' },
    fontWeight: 500,
    marginTop: 1
  }
};
