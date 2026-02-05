type Props = {
  questions: { question: string; count: number }[];
};

export function TopQuestions({ questions }: Props) {
  if (questions.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">No questions recorded yet.</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 pr-4 text-left font-medium text-text-secondary">
              Question
            </th>
            <th className="py-2 text-right font-medium text-text-secondary w-20">
              Count
            </th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.question} className="border-b border-border/50">
              <td className="py-2 pr-4 text-text-primary truncate max-w-md">
                {q.question}
              </td>
              <td className="py-2 text-right text-text-secondary font-mono">
                {q.count}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
