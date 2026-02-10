"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BellIcon } from "./icons";

// Notification data using translation keys
const notificationList = [
  {
    image: "/images/user/user-15.png",
    titleKey: "notifications.piterJoined",
    subTitleKey: "notifications.congratulateHim",
  },
  {
    image: "/images/user/user-03.png",
    titleKey: "notifications.newMessage",
    subTitleKey: "notifications.devidSent",
  },
  {
    image: "/images/user/user-26.png",
    titleKey: "notifications.newPayment",
    subTitleKey: "notifications.checkEarnings",
  },
  {
    image: "/images/user/user-28.png",
    titleKey: "notifications.jollyCompleted",
    subTitleKey: "notifications.assignTask",
  },
  {
    image: "/images/user/user-27.png",
    titleKey: "notifications.romanJoined",
    subTitleKey: "notifications.congratulateHim",
  },
];

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(true);
  const isMobile = useIsMobile();
  const { t } = useTranslation();

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label={t("notifications.title")}
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[20rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            {t("notifications.title")}
          </span>
          <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
            {t("notifications.new", { count: 5 })}
          </span>
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {notificationList.map((item, index) => (
            <li key={index} role="menuitem">
              <Link
                href="#"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
              >
                <Image
                  src={item.image}
                  className="size-14 rounded-full object-cover"
                  width={200}
                  height={200}
                  alt="User"
                />

                <div>
                  <strong className="block text-sm font-medium text-dark dark:text-white">
                    {t(item.titleKey)}
                  </strong>

                  <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6">
                    {t(item.subTitleKey)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="#"
          onClick={() => setIsOpen(false)}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          {t("notifications.seeAll")}
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
