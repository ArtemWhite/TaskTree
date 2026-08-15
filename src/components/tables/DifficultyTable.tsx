import type { Task } from '../../types';
import { DIFFICULTY_META, DIFFICULTY_ORDER } from '../../constants/difficulty';
import { formatXP } from '../../utils/formatUtils';

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
          {DIFFICULTY_ORDER.map(diff => {
            const meta = DIFFICULTY_META[diff];
            const active = tasks.filter(t => !t.completed && t.difficulty === diff).length;
            const done = tasks.filter(t => t.completed && t.difficulty === diff).length;
            const total = active + done;
            const earnedXP = done * meta.xp;

            return (
              <tr key={diff}>
                <td style={{ fontWeight: 600 }}>{meta.emoji} {meta.label}</td>
                <td>{meta.xp} XP</td>
                <td>{active}</td>
                <td>{done}</td>
                <td>{total}</td>
                <td>{formatXP(earnedXP)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
