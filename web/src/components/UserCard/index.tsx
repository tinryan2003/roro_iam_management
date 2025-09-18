import { MoreHorizontal } from "lucide-react";

const UserCard = ({ type }: { type: string }) => {
  const getCardStyles = (cardType: string) => {
    switch (cardType) {
      case "employee":
        return "bg-blue-50 border-blue-200 hover:border-blue-300";
      case "teacher": 
        return "bg-green-50 border-green-200 hover:border-green-300";
      case "parent":
        return "bg-purple-50 border-purple-200 hover:border-purple-300";
      case "staff":
        return "bg-orange-50 border-orange-200 hover:border-orange-300";
      default:
        return "bg-gray-50 border-gray-200 hover:border-gray-300";
    }
  };

  const getIconColor = (cardType: string) => {
    switch (cardType) {
      case "employee":
        return "text-blue-600 bg-blue-100";
      case "teacher": 
        return "text-green-600 bg-green-100";
      case "parent":
        return "text-purple-600 bg-purple-100";
      case "staff":
        return "text-orange-600 bg-orange-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getNumberColor = (cardType: string) => {
    switch (cardType) {
      case "employee":
        return "text-blue-700";
      case "teacher": 
        return "text-green-700";
      case "parent":
        return "text-purple-700";
      case "staff":
        return "text-orange-700";
      default:
        return "text-gray-700";
    }
  };

  return (
    <div className={`
      card-hover rounded-2xl border-2 p-4 flex-1 min-w-[130px] 
      bg-white dark:bg-gray-800 
      shadow-lg 
      ${getCardStyles(type)}
      dark:border-gray-700 dark:hover:border-gray-600
    `}>
      <div className="flex justify-between items-center mb-4">
        <span className={`
          text-xs font-medium px-3 py-1 rounded-full 
          ${getIconColor(type)}
          dark:bg-gray-700 dark:text-gray-300
        `}>
          2024/25
        </span>
        <button 
          className="smooth-hover p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 focus-ring"
          aria-label="More options"
          title="More options"
        >
          <MoreHorizontal 
            size={16}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          />
        </button>
      </div>
      
      <div className="space-y-2">
        <h1 className={`text-2xl lg:text-3xl font-bold ${getNumberColor(type)} dark:text-white`}>
          1,234
        </h1>
        <h2 className="capitalize text-sm font-medium text-gray-600 dark:text-gray-400">
          {type}s
        </h2>
      </div>
    </div>
  );
};

export default UserCard;