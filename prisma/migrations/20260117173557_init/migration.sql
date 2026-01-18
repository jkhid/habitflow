-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "profilePicture" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "habits" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "frequencyGoal" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentStreak" INTEGER NOT NULL DEFAULT 0,
    "longestStreak" INTEGER NOT NULL DEFAULT 0,
    "lastCheckIn" DATETIME,
    CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "check_ins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "check_ins_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "check_ins_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "cheers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "checkInId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎉',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cheers_checkInId_fkey" FOREIGN KEY ("checkInId") REFERENCES "check_ins" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cheers_giverId_fkey" FOREIGN KEY ("giverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cheers_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");

-- CreateIndex
CREATE UNIQUE INDEX "check_ins_habitId_date_key" ON "check_ins"("habitId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "cheers_checkInId_giverId_key" ON "cheers"("checkInId", "giverId");
