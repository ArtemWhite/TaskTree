import type { Task } from '../../types';

interface Props {
  tasks: Task[];
}

export default function DifficultyTable({ tasks }: Props) {
  return (
    <div className="card-panel" style={{ overflowX: 'auto' }}>
      <h3 className="micro-cap" style={{ marginBottom: '16px' }}>РАСПРЕДЕЛЕНИЕ ПО СЛОЖНОСТИ</h3>
      <table className="table-spacex">
        <thead>
          <tr>
            <th>Сложность</th>
            <th>Опыт (XP)</th>
            <th>Активных</th>
            <th>Выполнено</th>
            <th>Всего</th>
            <th>Заработано XP</th>
          </tr>
        </thead>
        <tbody>
          {(['easy', 'medium', 'hard'] as const).map(diff => {
            const label = diff === 'easy' ? '🟢 Лёгкая' : diff === 'medium' ? '🟡 Средняя' : '🔴 Сложная';
            const xpVal = diff === 'easy' ? 20 : diff === 'medium' ? 50 : 100;
            const active = tasks.filter(t => !t.completed && t.difficulty === diff).length;
            const done = tasks.filter(t => t.completed && t.difficulty === diff).length;
            const total = active + done;
            const earnedXP = done * xpVal;

            return (
              <tr key={diff}>
                <td style={{ fontWeight: 600 }}>{label}</td>
                <td>{xpVal} XP</td>
                <td>{active}</td>
                <td>{done}</td>
                <td>{total}</td>
                <td>+{earnedXP} XP</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
