﻿using DBExportor.Pods;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace DBExportor.Controllers
{
    public class ControllerBase : Controller
    {
        protected static readonly Dictionary<string, StandardDB> DBList = new Dictionary<string, StandardDB>();
        protected static readonly Dictionary<string, Dictionary<string, object>> CacheList = new Dictionary<string, Dictionary<string, object>>();
        protected static readonly JsonSerializer Serializer = new JsonSerializer();

        protected string ObjName { get => HttpContext.Request.Headers["objid"].FirstOrDefault(); }

        protected bool CheckAuth() => HttpContext.Request.Headers["authval"].Contains(Program.Auth);

        protected bool TryGetDB(out StandardDB ret) => DBList.TryGetValue(ObjName, out ret);
        protected bool TryGetCache(out Dictionary<string, object> ret) => CacheList.TryGetValue(ObjName, out ret);
        protected bool NewDB(StandardDB db)

        {
            if (ObjName != null)
                DBList[ObjName] = db;
            return ObjName != null;
        }

        protected bool NewCache(Dictionary<string, object> cache)
        {
            if (ObjName != null)
                CacheList[ObjName] = cache;
            return ObjName != null;
        }

        protected bool DelDB()
        {
            if (ObjName != null)
            {
                GC.Collect(2, GCCollectionMode.Optimized, false, true);
                return DBList.Remove(ObjName);
            }
            return false;
        }
        protected bool DelCache()
        {
            if (ObjName != null)
            {
                GC.Collect(2, GCCollectionMode.Optimized, false, true);
                return CacheList.Remove(ObjName);
            }
            return false;
        }
    }
}
