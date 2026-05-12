export type Message = {
  id: string;
  role: "user" | "model";
  content: string;
  isNew?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
};

export type FormData = {
  message: string;
};
