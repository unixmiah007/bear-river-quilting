import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <>
      <h1>Welcome</h1>
      <p className="page-body">
        This is a small content site backed by MySQL. Add pages and products in the admin,
        then attach published products to any page. Open <Link to="/admin/login">Admin</Link>{' '}
        to get started.
      </p>
    </>
  );
}
