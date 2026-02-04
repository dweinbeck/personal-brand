interface RepoCardProps {
  name: string;
  url: string;
  isPrivate: boolean;
  lastCommit: string;
  purpose: string;
}

export function RepoCard({ name, url, isPrivate, lastCommit, purpose }: RepoCardProps) {
  const date = new Date(lastCommit);
  const formatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
    >
      <div className="flex items-center gap-2 mb-2">
        <h3 className="text-base font-semibold text-gray-900">{name}</h3>
        {isPrivate && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
            Private
          </span>
        )}
      </div>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{purpose}</p>
      <p className="text-xs text-gray-400">Last commit: {formatted}</p>
    </a>
  );
}
