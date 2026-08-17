import { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../services/firebase.js';
import COLLECTIONS from '../../lib/schema.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getBrandProfile } from '../../services/brandService.js';

function WorkspaceSelector() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchWorkspaces = async () => {
      try {
        const q = query(collection(db, COLLECTIONS.workspaces), where('ownerId', '==', currentUser.uid));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setWorkspaces(list);
        if (list.length === 1) {
          const profileResult = await getBrandProfile(list[0].id);
          if (profileResult.success && profileResult.profile) {
            navigate(`/app/${list[0].id}/content`, { replace: true });
          } else {
            navigate(`/app/${list[0].id}/brand/setup`, { replace: true });
          }
        } else if (list.length === 0) {
          navigate('/app/workspaces/create', { replace: true });
        }
      } catch (err) {
        console.error('Error fetching workspaces:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [currentUser, navigate]);

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Loading workspaces…</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px' }}>
      <h1>Select a Workspace</h1>
      <p>Select a workspace to continue managing your content.</p>

      {workspaces.length > 1 ? (
        <div style={{ marginTop: '24px' }}>
          <ul style={{ listStyle: 'none', padding: 0, maxWidth: '540px' }}>
            {workspaces.map((workspace) => (
              <li key={workspace.id} style={{ marginBottom: '16px' }}>
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    cursor: 'pointer'
                  }}
                  onClick={async () => {
                    try {
                      const profileResult = await getBrandProfile(workspace.id);
                      if (profileResult.success && profileResult.profile) {
                        navigate(`/app/${workspace.id}/content`);
                      } else {
                        navigate(`/app/${workspace.id}/brand/setup`);
                      }
                    } catch (err) {
                      console.error(err);
                      navigate(`/app/${workspace.id}/content`);
                    }
                  }}
                >
                  <strong>{workspace.name}</strong>
                  <div style={{ marginTop: '6px', color: '#555' }}>
                    {workspace.niche || 'Workspace'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{ padding: '24px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <p>No workspaces were found for your account.</p>
          <button
            style={{ marginTop: '16px', padding: '12px 20px', borderRadius: '6px', border: 'none', background: '#4f46e5', color: '#fff', cursor: 'pointer' }}
            onClick={() => navigate('/app/workspaces/create')}
          >
            Create a Workspace
          </button>
        </div>
      )}
    </div>
  );
}

export default WorkspaceSelector;
