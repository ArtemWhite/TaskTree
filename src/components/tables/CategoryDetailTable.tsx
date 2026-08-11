import type { Task, Category } from '../../types';

interface Props {
  tasks: Task[];
  categories: Category[];
}

export default function CategoryDetailTable({ tasks, categories }: Props) {
  return (
    <div className="card-panel" style={{ overflowX: 'auto' }}>
      <h3 className="micro-cap" style={{ marginBottom: '16px' }}>ДЕТАЛИЗАЦИЯ ПО КАТЕГОРИЯМ</h3>
      <table className="table-spacex">
        <thead>
          <tr>
            <th>Иконка</th>
            <th>Название</th>
            <th>Всего задач</th>
            <th>Активных</th>
            <th>Выполнено</th>
            <th>Процент выполнения</th>
            <th>Всего XP</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(c => {
            const total = tasks.filter(t => t.categoryId === c.id).length;
            const active = tasks.filter(t => t.categoryId === c.id && !t.completed).length;
            const done = tasks.filter(t => t.categoryId === c.id && t.completed).length;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            const xp = tasks.filter(t => t.categoryId === c.id && t.completed).reduce((s, t) => s + t.xp, 0);

            return (
              <tr key={c.id}>
                <td style={{ fontSize: '20px' }}>{c.emoji}</td>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{total}</td>
                <td>{active}</td>
                <td>{done}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="progress-bar" style={{ flex: 1, height: '4px' }}>
                      <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span style={{ fontSize: '11px' }}>{pct}%</span>
                  </div>
                </td>
                <td>+{xp} XP</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
