import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = user.role === 'admin' || user.custom_role === 'admin';
    const isGestor = user.custom_role === 'gestor';

    if (!isAdmin && !isGestor) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const allUsers = await base44.asServiceRole.entities.User.list('-created_date');
    const students = allUsers.filter(u => u.role === 'user');

    // Gestor vê alunos da sua loja + alunos sem loja vinculada
    if (isGestor && user.store_id) {
      const storeStudents = students.filter(s =>
        s.store_id === user.store_id || !s.store_id || s.store_id === '' || s.store_id === 'null'
      );
      return Response.json({ students: storeStudents });
    }

    return Response.json({ students });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});